import "server-only";
import { deepseekChat, DeepSeekError } from "@/lib/ai/deepseek";
import type { BriefingFacts } from "@/lib/data/commodityFlow";
import { formatMt } from "@/lib/format";

// Verbatim from README.md's "AI-Generated Weekly Trade Briefing" design, plus
// a final rule pinning the date label — left to itself the model reformats the
// range, and a restated date is as wrong as a restated tonnage.
export const BRIEFING_SYSTEM_PROMPT = `You are a trade-intelligence analyst writing a short weekly briefing for
port operations stakeholders at Port Qasim and Karachi Port Trust.

You will be given structured JSON with this week's and last week's total
import/export volume (metric tons), the top commodity categories by
volume, and the import/export split per port. Using ONLY the numbers
provided:

- Write 2-4 sentences, plain language, no jargon.
- Lead with the single most notable change (a WoW swing, a new top
  commodity, a port imbalance shift).
- State figures with their units (MT) and time period explicitly.
- Never speculate beyond the given data — if a figure isn't in the input,
  do not mention it.
- Note explicitly if a number may be undercounted due to partial 24h
  tonnage reporting (this will be flagged in the input when relevant).
- Do not use superlatives ("massive", "huge") — state the percentage or
  volume change plainly instead.
- Copy the PERIOD label exactly as written. Do not reformat or restate the
  dates in any other way.
- Do not compare, rank, or work out relationships between figures yourself.
  Every valid comparison is already listed under RELATIONSHIPS — use those
  and no others. Never write that one figure is higher, lower, more or fewer
  than another unless that exact relationship appears in RELATIONSHIPS.

Output plain text only, no markdown, no headings.`;

export interface GeneratedBriefing {
  text: string;
  source: "ai" | "fallback";
  /** Invented figures that forced a retry or the fallback. Logged, not shown. */
  validationIssues: string[];
}

function formatPct(pct: number | null): string {
  if (pct === null) return "not available";
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

/**
 * Every comparison the briefing is allowed to make, worked out in code.
 *
 * Giving the model correct figures is not enough — asked to compare them it
 * will state relationships backwards ("20 export calls, more than 32"), and
 * those read as authoritative because each individual number checks out. So
 * comparisons are computed here and the model is told to copy them verbatim.
 */
export function buildRelationships(facts: BriefingFacts): string[] {
  const rels: string[] = [];

  const direction = (pct: number) => (pct >= 0 ? "rose" : "fell");

  if (facts.importWoWPct !== null) {
    rels.push(
      `Imports ${direction(facts.importWoWPct)} ${Math.abs(facts.importWoWPct).toFixed(1)}% week-over-week.`
    );
  }
  if (facts.exportWoWPct !== null) {
    rels.push(
      `Exports ${direction(facts.exportWoWPct)} ${Math.abs(facts.exportWoWPct).toFixed(1)}% week-over-week.`
    );
  }
  if (facts.importMoMPct !== null) {
    rels.push(
      `Imports ${direction(facts.importMoMPct)} ${Math.abs(facts.importMoMPct).toFixed(1)}% against the same week four weeks earlier.`
    );
  }

  if (facts.topCategories.length > 0) {
    const [top, second] = facts.topCategories;
    rels.push(
      `${top.category} is the highest-volume category at ${formatMt(top.totalMt)} MT.`
    );
    if (second) {
      rels.push(
        `${top.category} (${formatMt(top.totalMt)} MT) is higher than ${second.category} (${formatMt(second.totalMt)} MT).`
      );
    }
  }

  rels.push(
    facts.totalImportMt >= facts.totalExportMt
      ? `Import volume (${formatMt(facts.totalImportMt)} MT) is higher than export volume (${formatMt(facts.totalExportMt)} MT).`
      : `Export volume (${formatMt(facts.totalExportMt)} MT) is higher than import volume (${formatMt(facts.totalImportMt)} MT).`
  );

  // Port-vs-port comparisons: only meaningful with exactly two ports, which is
  // the shape of this dataset (PQ and KPT).
  if (facts.ports.length === 2) {
    const [a, b] = facts.ports;
    const compare = (
      metric: string,
      aVal: number,
      bVal: number,
      unit: string
    ) => {
      const [hi, lo] = aVal >= bVal ? [a, b] : [b, a];
      const [hiVal, loVal] = aVal >= bVal ? [aVal, bVal] : [bVal, aVal];
      const fmt = (v: number) => (unit ? `${formatMt(v)} ${unit}` : String(v));
      rels.push(`${hi.port} recorded more ${metric} (${fmt(hiVal)}) than ${lo.port} (${fmt(loVal)}).`);
    };

    compare("import tonnage", a.importMt, b.importMt, "MT");
    compare("export tonnage", a.exportMt, b.exportMt, "MT");
    compare("import calls", a.importCount, b.importCount, "");
    compare("export calls", a.exportCount, b.exportCount, "");
  }

  for (const p of facts.ports) {
    if (p.importMt === 0 && p.exportMt === 0) continue;
    rels.push(
      p.importMt >= p.exportMt
        ? `${p.port} moved more import tonnage (${formatMt(p.importMt)} MT) than export tonnage (${formatMt(p.exportMt)} MT).`
        : `${p.port} moved more export tonnage (${formatMt(p.exportMt)} MT) than import tonnage (${formatMt(p.importMt)} MT).`
    );
  }

  return rels;
}

/**
 * Renders the facts as pre-formatted text rather than raw JSON. Handing the
 * model figures already written the way we want them stated ("1,243,891 MT")
 * means the correct output is also the laziest one — it copies instead of
 * reformatting, which is where transcription errors come from.
 */
export function buildBriefingUserMessage(facts: BriefingFacts): string {
  const lines: string[] = [];

  lines.push(`PERIOD: ${facts.periodLabel}`);
  lines.push("");
  lines.push(`TOTAL IMPORT: ${formatMt(facts.totalImportMt)} MT`);
  lines.push(`  week-over-week: ${formatPct(facts.importWoWPct)}`);
  lines.push(`  month-over-month: ${formatPct(facts.importMoMPct)}`);
  lines.push(`TOTAL EXPORT: ${formatMt(facts.totalExportMt)} MT`);
  lines.push(`  week-over-week: ${formatPct(facts.exportWoWPct)}`);
  lines.push(`  month-over-month: ${formatPct(facts.exportMoMPct)}`);
  lines.push("");

  lines.push("TOP COMMODITY CATEGORIES THIS PERIOD:");
  if (facts.topCategories.length === 0) {
    lines.push("  none with reported tonnage");
  } else {
    facts.topCategories.forEach((c, i) => {
      lines.push(`  ${i + 1}. ${c.category} — ${formatMt(c.totalMt)} MT`);
    });
  }
  lines.push("");

  lines.push("PORT SPLIT THIS PERIOD:");
  if (facts.ports.length === 0) {
    lines.push("  no port activity recorded");
  } else {
    for (const p of facts.ports) {
      lines.push(
        `  ${p.port}: ${p.importCount} import calls (${formatMt(p.importMt)} MT), ` +
          `${p.exportCount} export calls (${formatMt(p.exportMt)} MT)`
      );
    }
  }
  lines.push("");

  lines.push("RELATIONSHIPS (the only comparisons you may state):");
  for (const rel of buildRelationships(facts)) {
    lines.push(`  - ${rel}`);
  }
  lines.push("");

  lines.push(
    facts.coverageWarning
      ? `DATA CAVEAT (must be mentioned): ${facts.coverageWarning}`
      : "DATA CAVEAT: none — do not mention undercounting or missing data."
  );

  return lines.join("\n");
}

// Matches a quantitative claim: a number, an optional magnitude, and a unit.
// Deliberately requires the unit — bare integers ("two ports", "2026") make no
// tonnage or percentage claim, so validating them only produces false alarms.
const CLAIM_RE =
  /(-?\d[\d,]*(?:\.\d+)?)\s*(million|billion|thousand|[MKB])?\s*(MT\b|metric tons?\b|tonnes?\b|tons?\b|%|percent\b)/gi;

const MAGNITUDES: Record<string, number> = {
  k: 1_000,
  thousand: 1_000,
  m: 1_000_000,
  million: 1_000_000,
  b: 1_000_000_000,
  billion: 1_000_000_000,
};

// The model rounds for readability ("1.24M MT" for 1,243,891), so exact
// matching would reject correct output. 5% absorbs any sensible rounding while
// still catching a figure that simply isn't in the data.
const TONNAGE_TOLERANCE_PCT = 5;
// Percentages get an absolute floor too: 12.3% written as "12%" is only 0.3
// apart but 2.4% off in relative terms.
const PCT_TOLERANCE_ABS = 0.55;

function collectAllowedValues(facts: BriefingFacts): {
  tonnages: number[];
  percentages: number[];
} {
  const tonnages = [
    facts.totalImportMt,
    facts.totalExportMt,
    ...facts.topCategories.map((c) => c.totalMt),
    ...facts.ports.flatMap((p) => [p.importMt, p.exportMt]),
  ];

  const percentages = [
    facts.importWoWPct,
    facts.exportWoWPct,
    facts.importMoMPct,
    facts.exportMoMPct,
  ].filter((p): p is number => p !== null);

  // The caveat sentence carries its own percentage, and the model is told to
  // repeat it — so it has to be an allowed value.
  if (facts.coverageWarning) {
    const m = facts.coverageWarning.match(/(\d+(?:\.\d+)?)%/);
    if (m) percentages.push(Number(m[1]));
  }

  return { tonnages, percentages };
}

function matchesAny(value: number, allowed: number[], absoluteFloor: number): boolean {
  return allowed.some((a) => {
    const diff = Math.abs(value - Math.abs(a));
    if (diff <= absoluteFloor) return true;
    if (a === 0) return value === 0;
    return (diff / Math.abs(a)) * 100 <= TONNAGE_TOLERANCE_PCT;
  });
}

/**
 * The trust gate. Every tonnage and percentage in the generated text must trace
 * back to a value in `facts`; anything else is an invention and blocks the send.
 *
 * Returns the offending claims — empty means the text is safe to email.
 */
export function validateBriefingNumbers(text: string, facts: BriefingFacts): string[] {
  // The period label legitimately contains digits the model was told to copy.
  const haystack = text.split(facts.periodLabel).join(" ");
  const { tonnages, percentages } = collectAllowedValues(facts);
  const issues: string[] = [];

  for (const match of Array.from(haystack.matchAll(CLAIM_RE))) {
    const [claim, rawValue, rawMagnitude, rawUnit] = match;

    const base = Number(rawValue.replace(/,/g, ""));
    if (!Number.isFinite(base)) continue;

    const magnitude = rawMagnitude ? MAGNITUDES[rawMagnitude.toLowerCase()] ?? 1 : 1;
    const value = Math.abs(base * magnitude);

    const isPercent = rawUnit === "%" || rawUnit.toLowerCase().startsWith("percent");
    const ok = isPercent
      ? matchesAny(value, percentages, PCT_TOLERANCE_ABS)
      : matchesAny(value, tonnages, 0);

    if (!ok) issues.push(claim.trim());
  }

  return issues;
}

// "X (20) ... than/versus ... Y (32)" — a comparative word, then a number,
// then the pivot, then the number being compared against. Bounded by sentence
// punctuation so a claim can't match across two unrelated sentences.
//
// The magnitude suffix needs the lookahead: without it the "M" of "MT" reads
// as "million" and 15,663 MT is compared as 15.6 billion.
const MAGNITUDE_SUFFIX = String.raw`(million|billion|thousand|[MKB](?![A-Za-z]))?`;

const COMPARISON_RE = new RegExp(
  String.raw`\b(more|higher|greater|larger|bigger|less|lower|fewer|smaller)\b` +
    String.raw`[^.;:]{0,80}?(\d[\d,]*(?:\.\d+)?)\s*` + MAGNITUDE_SUFFIX +
    String.raw`[^.;:]{0,80}?\b(?:than|versus|vs\.?)\b` +
    String.raw`[^.;:]{0,80}?(\d[\d,]*(?:\.\d+)?)\s*` + MAGNITUDE_SUFFIX,
  "gi"
);

const LESS_WORDS = new Set(["less", "lower", "fewer", "smaller"]);

/**
 * Catches comparisons stated backwards.
 *
 * validateBriefingNumbers only proves each figure is real — it passed
 * "more export calls (20) than Port Qasim (32)", where both numbers are
 * genuine but the claim is false. This checks that the asserted direction
 * actually holds between the two numbers.
 */
export function validateComparativeClaims(text: string, facts: BriefingFacts): string[] {
  const haystack = text.split(facts.periodLabel).join(" ");
  const issues: string[] = [];

  for (const match of Array.from(haystack.matchAll(COMPARISON_RE))) {
    const [claim, word, leftRaw, leftMag, rightRaw, rightMag] = match;

    const scale = (mag?: string) => (mag ? MAGNITUDES[mag.toLowerCase()] ?? 1 : 1);
    const left = Number(leftRaw.replace(/,/g, "")) * scale(leftMag);
    const right = Number(rightRaw.replace(/,/g, "")) * scale(rightMag);
    if (!Number.isFinite(left) || !Number.isFinite(right)) continue;

    // Equal values make either wording defensible; only a strict reversal is
    // an error worth blocking on.
    const claimsLess = LESS_WORDS.has(word.toLowerCase());
    const reversed = claimsLess ? left > right : left < right;

    if (reversed) {
      issues.push(`reversed comparison: "${claim.trim()}" (${left} vs ${right})`);
    }
  }

  return issues;
}

/**
 * Deterministic briefing, no model involved. The weekly email must go out even
 * when DeepSeek is down, out of credit, or producing figures we won't stand
 * behind — a plainer briefing is fine, a missed or wrong one is not.
 */
export function buildFallbackBriefing(facts: BriefingFacts): string {
  const sentences: string[] = [];

  const wow =
    facts.importWoWPct === null
      ? ""
      : ` (${facts.importWoWPct >= 0 ? "up" : "down"} ${Math.abs(facts.importWoWPct).toFixed(1)}% week-over-week)`;

  sentences.push(
    `Over ${facts.periodLabel}, Port Qasim and Karachi Port Trust reported ` +
      `${formatMt(facts.totalImportMt)} MT of imports${wow} and ` +
      `${formatMt(facts.totalExportMt)} MT of exports.`
  );

  if (facts.topCategories.length > 0) {
    const top = facts.topCategories[0];
    sentences.push(`${top.category} led by volume at ${formatMt(top.totalMt)} MT.`);
  }

  for (const p of facts.ports) {
    sentences.push(
      `${p.port} recorded ${p.importCount} import calls (${formatMt(p.importMt)} MT) ` +
        `and ${p.exportCount} export calls (${formatMt(p.exportMt)} MT).`
    );
  }

  if (facts.coverageWarning) sentences.push(facts.coverageWarning);

  return sentences.join(" ");
}

/**
 * Generates the weekly briefing: model writes the prose, code owns the numbers.
 * One retry on validation failure (quoting the invented figures back), then the
 * deterministic fallback. Never throws.
 */
export async function generateBriefing(facts: BriefingFacts): Promise<GeneratedBriefing> {
  const userMessage = buildBriefingUserMessage(facts);
  const allIssues: string[] = [];

  const validate = (text: string) => [
    ...validateBriefingNumbers(text, facts),
    ...validateComparativeClaims(text, facts),
  ];

  try {
    let text = await deepseekChat(
      [
        { role: "system", content: BRIEFING_SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      { temperature: 0.2, maxTokens: 300 }
    );

    let issues = validate(text);
    if (issues.length === 0) return { text, source: "ai", validationIssues: [] };

    allIssues.push(...issues);
    console.warn("Briefing failed validation, retrying:", issues);

    text = await deepseekChat(
      [
        { role: "system", content: BRIEFING_SYSTEM_PROMPT },
        { role: "user", content: userMessage },
        { role: "assistant", content: text },
        {
          role: "user",
          content:
            `These claims are not supported by the data provided: ${issues.join("; ")}. ` +
            `Rewrite the briefing using only figures copied from the input above and only ` +
            `comparisons listed under RELATIONSHIPS. Do not calculate new numbers, ratios, ` +
            `or totals, and do not compare two figures yourself.`,
        },
      ],
      { temperature: 0, maxTokens: 300 }
    );

    issues = validate(text);
    if (issues.length === 0) return { text, source: "ai", validationIssues: allIssues };

    allIssues.push(...issues);
    console.error("Briefing failed validation twice, using fallback:", issues);
  } catch (err) {
    const message = err instanceof DeepSeekError ? err.message : String(err);
    console.error("Briefing generation failed, using fallback:", message);
    allIssues.push(message);
  }

  return {
    text: buildFallbackBriefing(facts),
    source: "fallback",
    validationIssues: allIssues,
  };
}
