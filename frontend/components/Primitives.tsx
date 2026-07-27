"use client";

import { ReactNode } from "react";
import { AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";
import type { Priority, ScanStatus } from "@/lib/api";

const priorityConfig: Record<Priority, { label: string; color: string; tint: string; icon: ReactNode }> = {
  urgent: {
    label: "Urgent",
    color: "var(--color-urgent)",
    tint: "var(--color-urgent-tint)",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
  moderate: {
    label: "Moderate",
    color: "var(--color-moderate)",
    tint: "var(--color-moderate-tint)",
    icon: <AlertCircle className="h-3.5 w-3.5" />,
  },
  low: {
    label: "Low",
    color: "var(--color-low)",
    tint: "var(--color-low-tint)",
    icon: <CheckCircle className="h-3.5 w-3.5" />,
  },
};

export function PriorityBadge({ priority, pulse = false }: { priority: Priority; pulse?: boolean }) {
  const cfg = priorityConfig[priority];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        priority === "urgent" && pulse ? "animate-pulse-ring" : ""
      }`}
      style={{ color: cfg.color, backgroundColor: cfg.tint }}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

const statusLabels: Record<ScanStatus, string> = {
  pending: "Pending review",
  reviewed: "Reviewed",
  cleared: "Cleared",
};

export function StatusBadge({ status }: { status: ScanStatus }) {
  const isPending = status === "pending";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
        isPending
          ? "bg-[var(--color-surface-hover)] text-[var(--color-text-dim)]"
          : "bg-[var(--color-primary-tint)] text-[var(--color-primary)]"
      }`}
    >
      {statusLabels[status]}
    </span>
  );
}

export function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-[var(--color-surface-hover)] overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-[family-name:var(--font-jetbrains-mono)] text-[var(--color-text-dim)] w-9 text-right">
        {pct}%
      </span>
    </div>
  );
}

export function EmptyState({
  icon, title, description, action,
}: { icon: ReactNode; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[var(--color-border)] py-16 px-6 text-center bg-white">
      <div className="text-[var(--color-text-dim)]">{icon}</div>
      <h3 className="font-[family-name:var(--font-manrope)] font-semibold text-[var(--color-text)]">{title}</h3>
      <p className="text-sm text-[var(--color-text-dim)] max-w-sm">{description}</p>
      {action}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-[var(--color-surface-hover)] ${className}`} />;
}
