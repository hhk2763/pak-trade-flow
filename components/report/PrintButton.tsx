"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden inline-flex items-center gap-xs px-md py-xs rounded-full bg-primary text-on-primary font-label-caps text-label-caps uppercase whitespace-nowrap hover:opacity-90"
    >
      <span className="material-symbols-outlined text-[16px]" aria-hidden>
        picture_as_pdf
      </span>
      Save as PDF
    </button>
  );
}
