"use client";

import { useState } from "react";

export function ContactForm({ categories }: { categories: string[] }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [commodityInterest, setCommodityInterest] = useState("");
  const [message, setMessage] = useState("");
  const [subscribeWeekly, setSubscribeWeekly] = useState(true);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, commodityInterest, message, subscribeWeekly }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Something went wrong. Please try again.");
      }
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center text-center gap-sm py-xl">
        <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
          <span className="material-symbols-outlined">check</span>
        </div>
        <p className="font-headline-sm text-headline-sm text-on-surface">
          Thanks — message sent.
        </p>
        <p className="font-body-md text-body-md text-on-surface-variant">
          We&apos;ll get back to you shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-md">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
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
      </div>

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
          rows={4}
          className="px-md py-sm rounded-lg border border-outline-variant bg-background font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary resize-none"
          placeholder="What are you trying to track?"
        />
      </label>

      <label className="flex items-start gap-sm cursor-pointer">
        <input
          type="checkbox"
          checked={subscribeWeekly}
          onChange={(e) => setSubscribeWeekly(e.target.checked)}
          className="mt-0.5 w-4 h-4 shrink-0 accent-primary"
        />
        <span className="font-body-md text-body-md text-on-surface-variant">
          Email me the weekly AI trade briefing
        </span>
      </label>

      {status === "error" && <p className="font-body-md text-body-md text-error">{error}</p>}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="self-start mt-sm px-lg py-sm bg-primary text-on-primary rounded-full font-label-caps text-label-caps uppercase hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {status === "submitting" ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}
