import { timingSafeEqual } from "node:crypto";
import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import { generateBriefing } from "@/lib/ai/briefing";
import { buildBriefingFacts, getAllCommodityFlow } from "@/lib/data/commodityFlow";
import { forwardLead } from "@/lib/leadWebhook";

export const dynamic = "force-dynamic";
// Generation can take two DeepSeek round trips when the first output fails
// number validation, which overruns the default serverless timeout.
export const maxDuration = 60;

// A generated briefing stays valid until the ETL advances the data, so a
// duplicated or retried trigger within the same data-week reuses the text
// instead of paying for another generation.
const BRIEFING_CACHE_TTL_SECONDS = 7 * 24 * 60 * 60;

function isAuthorized(request: Request): boolean {
  const secret = process.env.BRIEFING_CRON_SECRET;
  if (!secret) return false;

  const header = request.headers.get("authorization") ?? "";
  const prefix = "Bearer ";
  if (!header.startsWith(prefix)) return false;

  const provided = Buffer.from(header.slice(prefix.length));
  const expected = Buffer.from(secret);
  // timingSafeEqual throws on length mismatch, so check that first.
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

/**
 * Generates the weekly AI trade briefing and hands it to the lead webhook,
 * where the Apps Script mails it to subscribers (see
 * docs/apps-script/sendWeeklyBriefing.gs).
 *
 * Unlike /api/lead this endpoint costs money and sends mail to the subscriber
 * list, so it requires BRIEFING_CRON_SECRET. Pass ?force=1 to bypass the cache
 * while testing.
 */
export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const rows = await getAllCommodityFlow();
  if (rows.length === 0) {
    return NextResponse.json(
      { ok: false, error: "No commodity_flow rows available to brief on." },
      { status: 503 }
    );
  }

  const facts = buildBriefingFacts(rows);
  const force = new URL(request.url).searchParams.get("force") === "1";

  const briefing = force
    ? await generateBriefing(facts)
    : await unstable_cache(() => generateBriefing(facts), ["weekly-briefing", facts.periodLabel], {
        revalidate: BRIEFING_CACHE_TTL_SECONDS,
        tags: ["weekly-briefing"],
      })();

  const subject = `PAK Trade Flow — Weekly Briefing, ${facts.periodLabel}`;

  // Reuses the existing Apps Script webhook. Lead payloads have no `action`
  // field, so branching on it there stays backwards-compatible.
  await forwardLead({
    action: "weekly-briefing",
    subject,
    bodyText: briefing.text,
    periodLabel: facts.periodLabel,
    periodStartDate: facts.periodStartDate,
    latestReportDate: facts.latestReportDate,
    source: briefing.source,
    generatedAt: new Date().toISOString(),
  });

  // Facts come back too so the exact numbers behind the prose can be checked
  // before the weekly trigger is wired up.
  //
  // The explicit charset matters: the briefing contains an en dash, and clients
  // that default to Latin-1 when it is absent (Windows PowerShell 5.1's
  // Invoke-RestMethod among them) mangle it into "â€“".
  return NextResponse.json(
    { ok: true, subject, briefing, facts },
    { headers: { "Content-Type": "application/json; charset=utf-8" } }
  );
}
