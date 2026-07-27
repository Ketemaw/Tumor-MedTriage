"use client";

import { createContext, useCallback, useContext, useState, ReactNode } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";
interface ToastItem { id: number; type: ToastType; message: string; }
interface ToastContextValue { push: (type: ToastType, message: string) => void; }

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const icons: Record<ToastType, ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 text-[var(--color-low)]" />,
  error: <XCircle className="h-4 w-4 text-[var(--color-urgent)]" />,
  info: <Info className="h-4 w-4 text-[var(--color-primary)]" />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((type: ToastType, message: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  const dismiss = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 w-80">
        {toasts.map((toast) => (
          <div key={toast.id} className="animate-fade-in-up flex items-start gap-2.5 rounded-lg border border-[var(--color-border)] bg-white px-4 py-3 shadow-xl shadow-black/10">
            {icons[toast.type]}
            <p className="flex-1 text-sm text-[var(--color-text)]">{toast.message}</p>
            <button onClick={() => dismiss(toast.id)} className="text-[var(--color-text-dim)] hover:text-[var(--color-text)]">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
