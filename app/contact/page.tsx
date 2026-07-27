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
          Contact Us
        </span>
        <h1 className="font-display-lg text-display-lg text-on-surface leading-none">
          Talk to Our Team
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mt-md">
          Tell us what you&apos;re trying to track and we&apos;ll get back to you — a specific
          commodity, a port, or a custom report.
        </p>
      </section>

      <section className="bg-surface-container-lowest rounded-xl shadow-sm p-lg">
        <ContactForm categories={categories} />
      </section>
    </div>
  );
}
