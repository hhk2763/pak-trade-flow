import { getAllCommodityFlow, getCategoryTotals } from "@/lib/data/commodityFlow";
import { ContactForm } from "@/components/contact/ContactForm";

export default async function ContactPage() {
  const rows = await getAllCommodityFlow();
  const categories = getCategoryTotals(rows)
    .filter((c) => c.totalMt > 0)
    .map((c) => c.category);

  return (
    <div className="flex flex-col w-full gap-xl max-w-2xl">
      <section className="flex flex-col gap-sm">
        <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest">
          Request a Pilot
        </span>
        <h1 className="font-display-lg text-display-lg text-on-surface leading-none">
          Try it on the sectors you cover
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mt-md">
          Tell us which sectors or cargoes you follow. A pilot gives your desk the weekly note,
          the full vessel line-up and the history export for four weeks, so you can test it
          against your own numbers before deciding.
        </p>
      </section>

      <section className="bg-surface-container-lowest rounded-xl shadow-sm p-lg">
        <ContactForm categories={categories} />
      </section>
    </div>
  );
}
