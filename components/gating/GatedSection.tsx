"use client";

import { useLeadGate } from "@/components/gating/LeadGateProvider";

export function GatedSection({
  children,
  label = "Unlock deep-dive shipment details and historical trends.",
  sublabel = "Just your name, email, and what you're tracking — takes 10 seconds.",
  className = "",
}: {
  children: React.ReactNode;
  label?: string;
  sublabel?: string;
  className?: string;
}) {
  const { unlocked, openModal } = useLeadGate();

  if (unlocked) return <>{children}</>;

  return (
    <div className={`relative overflow-hidden rounded-lg ${className}`}>
      <div aria-hidden className="pointer-events-none select-none blur-sm opacity-50">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/90 to-surface-container-lowest/50">
        <div className="flex flex-col items-center text-center gap-sm px-lg py-lg max-w-xs">
          <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
            <span className="material-symbols-outlined">lock</span>
          </div>
          <p className="font-headline-sm text-headline-sm text-on-surface">{label}</p>
          <p className="font-body-md text-body-md text-on-surface-variant">{sublabel}</p>
          <button
            type="button"
            onClick={openModal}
            className="mt-sm px-lg py-sm bg-primary text-on-primary rounded-full font-label-caps text-label-caps uppercase hover:opacity-90 transition-opacity"
          >
            Unlock Access
          </button>
        </div>
      </div>
    </div>
  );
}
