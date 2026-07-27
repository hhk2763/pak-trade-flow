"use client";

import { useState } from "react";

export function LeadCaptureModal({
  categories,
  onClose,
  onUnlock,
}: {
  categories: string[];
  onClose: () => void;
  onUnlock: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [commodityInterest, setCommodityInterest] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setError("");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, commodityInterest, message }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Something went wrong. Please try again.");
      }
      onUnlock();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-on-surface/40 backdrop-blur-sm px-md"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest rounded-xl shadow-lg w-full max-w-sm p-xl flex flex-col gap-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-md">
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface">
              Unlock Full Access
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
              Unlock deep-dive shipment details and historical trends.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 text-on-surface-variant hover:text-on-surface"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-md">
          <label className="flex flex-col gap-xs">
            <span className="font-label-caps text-label-caps text-outline uppercase">Name</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-md py-sm rounded-lg border border-outline-variant bg-background font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary"
              placeholder="Jane Doe"
            />
          </label>
          <label className="flex flex-col gap-xs">
            <span className="font-label-caps text-label-caps text-outline uppercase">
              Work Email
            </span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-md py-sm rounded-lg border border-outline-variant bg-background font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary"
              placeholder="jane@company.com"
            />
          </label>
          <label className="flex flex-col gap-xs">
            <span className="font-label-caps text-label-caps text-outline uppercase">
              Primary Commodity Interest
            </span>
            <select
              required
              value={commodityInterest}
              onChange={(e) => setCommodityInterest(e.target.value)}
              className="px-md py-sm rounded-lg border border-outline-variant bg-background font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary"
            >
              <option value="" disabled>
                Select a commodity…
              </option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value="Other">Other / Not sure yet</option>
            </select>
          </label>
          <label className="flex flex-col gap-xs">
            <span className="font-label-caps text-label-caps text-outline uppercase">
              Message <span className="normal-case text-on-surface-variant/70">(optional)</span>
            </span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="px-md py-sm rounded-lg border border-outline-variant bg-background font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary resize-none"
              placeholder="What are you trying to track?"
            />
          </label>

          {status === "error" && (
            <p className="font-body-md text-body-md text-error">{error}</p>
          )}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="mt-sm px-lg py-sm bg-primary text-on-primary rounded-full font-label-caps text-label-caps uppercase hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {status === "submitting" ? "Unlocking…" : "Unlock Now"}
          </button>
        </form>
      </div>
    </div>
  );
}
