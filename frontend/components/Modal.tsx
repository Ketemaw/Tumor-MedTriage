"use client";

import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({
  open, onClose, title, children,
}: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in-up" onClick={onClose} />
      <div className="relative w-full max-w-md animate-fade-in-up rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-2xl shadow-black/10">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-manrope)] font-semibold text-lg">{title}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-[var(--color-text-dim)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
