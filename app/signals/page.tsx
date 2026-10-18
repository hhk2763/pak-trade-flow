import { getAllVesselCalls, getThemeSignals } from "@/lib/data/vesselCalls";
import { SignalRow } from "@/components/signals/SignalRow";
import { GatedSection } from "@/components/gating/GatedSection";
import { formatDateRange } from "@/lib/format";

const WINDOW_DAYS = 28;
// Visible without an account: enough to show what a signal looks like.
const TEASER_COUNT = 2;

export default async function SignalsPage() {
  const calls = await getAllVesselCalls();
  const signals = getThemeSignals(calls, WINDOW_DAYS);
  const period = signals[0] ? formatDateRange(signals[0].periodStart, signals[0].periodEnd) : "";
  const teaser = signals.slice(0, TEASER_COUNT);
  const gated = signals.slice(TEASER_COUNT);

  return (
    <div className="flex flex-col w-full gap-xl">
      <section className="flex flex-col gap-sm">
        <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest">
          Equity Research
        </span>
        <h1 className="font-display-lg text-display-lg text-on-surface leading-none">
          PSX Trade Signals
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mt-md">
          Port cargo mapped to the listed companies it bears on: tonnage berthed in the last{" "}
          {WINDOW_DAYS} days ({period}) against the {WINDOW_DAYS} days before, plus what is already
          waiting at anchorage. Volumes land here weeks before they reach monthly trade data or
          quarterly results.
        </p>
      </section>

      <section className="flex flex-col gap-lg">
        {teaser.map((s) => (
          <SignalRow key={s.theme.id} signal={s} />
        ))}
        {gated.length > 0 && (
          <GatedSection
            label={`Unlock ${gated.length} more signals.`}
            sublabel="Crude, petrol and diesel, furnace oil, LNG, fertilizer, oilseeds, petrochemicals and steel."
          >
            <div className="flex flex-col gap-lg">
              {gated.map((s) => (
                <SignalRow key={s.theme.id} signal={s} />
              ))}
            </div>
          </GatedSection>
        )}
      </section>

      <section className="pb-xl">
        <p className="font-body-md text-[12px] text-on-surface-variant max-w-3xl">
          Tonnage is each vessel call&apos;s manifest, counted on its berthing date, from Port Qasim
          and Karachi Port Trust daily statements. Ticker mappings show which companies a flow bears
          on, with the reasoning under each signal; they are research inputs, not investment advice.
        </p>
      </section>
    </div>
  );
}
