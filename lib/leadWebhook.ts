import "server-only";
import { NextResponse } from "next/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function forwardLead(payload: Record<string, unknown>) {
  const webhookUrl = process.env.LEAD_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn("LEAD_WEBHOOK_URL not configured — captured lead was not forwarded:", payload);
    return;
  }

  try {
    // Google Apps Script Web Apps run the script (e.g. append the row) BEFORE
    // responding, then reply with a 302 to a script.googleusercontent.com
    // URL that just serves the output text. Letting fetch auto-follow that
    // redirect rewrites our POST into a bodyless GET and breaks (411 from
    // Google's frontend) — we don't need the output text, so don't follow it.
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      redirect: "manual",
    });
  } catch (err) {
    // Delivery to the CRM is a side-effect of the visitor's action, not a
    // precondition for it succeeding — don't fail their submission over a
    // downstream webhook outage.
    console.error("Failed to forward lead to LEAD_WEBHOOK_URL:", err);
  }
}

export async function handleLeadSubmission(request: Request, source: string) {
  let body: {
    name?: string;
    email?: string;
    commodityInterest?: string;
    message?: string;
    subscribeWeekly?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const name = body.name?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  const commodityInterest = body.commodityInterest?.trim() ?? "";
  const message = body.message?.trim() ?? "";
  // Only these addresses receive the weekly AI briefing — an email given to
  // unlock a chart is not consent to a recurring newsletter.
  const subscribeWeekly = body.subscribeWeekly === true;

  if (!name || !EMAIL_RE.test(email) || !commodityInterest) {
    return NextResponse.json(
      { ok: false, error: "Name, a valid email, and commodity interest are required." },
      { status: 400 }
    );
  }

  await forwardLead({
    name,
    email,
    commodityInterest,
    message: message || null,
    subscribeWeekly,
    source,
    submittedAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
