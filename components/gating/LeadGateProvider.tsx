"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { LeadCaptureModal } from "@/components/gating/LeadCaptureModal";

const STORAGE_KEY = "ptf_lead_unlocked";

interface LeadGateContextValue {
  unlocked: boolean;
  openModal: () => void;
}

const LeadGateContext = createContext<LeadGateContextValue | null>(null);

export function useLeadGate() {
  const ctx = useContext(LeadGateContext);
  if (!ctx) throw new Error("useLeadGate must be used within LeadGateProvider");
  return ctx;
}

export function LeadGateProvider({
  children,
  categories,
}: {
  children: React.ReactNode;
  categories: string[];
}) {
  const [unlocked, setUnlocked] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem(STORAGE_KEY) === "true") {
      setUnlocked(true);
    }
  }, []);

  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  const unlock = useCallback(() => {
    window.localStorage.setItem(STORAGE_KEY, "true");
    setUnlocked(true);
    setModalOpen(false);
  }, []);

  return (
    <LeadGateContext.Provider value={{ unlocked, openModal }}>
      {children}
      {modalOpen && (
        <LeadCaptureModal categories={categories} onClose={closeModal} onUnlock={unlock} />
      )}
    </LeadGateContext.Provider>
  );
}
