"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, RefreshCw } from "lucide-react";
import AppShell from "@/components/AppShell";
import Button from "@/components/Button";
import AuthedScanImage from "@/components/AuthedScanImage";
import { PriorityBadge, ConfidenceBar, Skeleton, EmptyState } from "@/components/Primitives";
import { queueApi, type Scan, ApiError } from "@/lib/api";
import { useToast } from "@/components/Toast";

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function QueuePage() {
  const [scans, setScans] = useState<Scan[] | null>(null);
  const [clearingId, setClearingId] = useState<number | null>(null);
  const { push } = useToast();

  const load = useCallback(async () => {
    try {
      setScans(await queueApi.get());
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        push("error", "Only radiologists can view the triage queue.");
      } else {
        push("error", "Couldn't load the triage queue.");
      }
      setScans([]);
    }
  }, [push]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
  useEffect(() => {
    load();
  }, [load]);

  async function handleClear(scanId: number) {
    setClearingId(scanId);
    try {
      await queueApi.review(scanId, "cleared");
      push("success", "Case cleared.");
      setScans((prev) => prev?.filter((s) => s.id !== scanId) ?? prev);
    } catch (err) {
      push("error", err instanceof ApiError ? err.detail : "Couldn't clear case.");
    } finally {
      setClearingId(null);
    }
  }

  const urgentCount = scans?.filter((s) => s.prediction?.priority === "urgent").length ?? 0;

  return (
    <AppShell>
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-manrope)] text-2xl font-bold">Triage Queue</h1>
          <p className="text-sm text-[var(--color-text-dim)] mt-1">
            Sorted by urgency — most critical cases first.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {urgentCount > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-[var(--color-urgent-tint)] px-3 py-1.5 text-sm font-semibold text-[var(--color-urgent)]">
              <span className="h-2 w-2 rounded-full bg-[var(--color-urgent)] animate-pulse-ring" />
              {urgentCount} urgent
            </span>
          )}
          <Button variant="secondary" size="sm" onClick={load}>
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        </div>
      </div>

      {scans === null && (
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      )}

      {scans?.length === 0 && (
        <EmptyState
          icon={<CheckCircle2 className="h-8 w-8 text-[var(--color-low)]" />}
          title="Queue is clear"
          description="No pending cases need review right now."
        />
      )}

      {scans && scans.length > 0 && (
        <div className="flex flex-col gap-3">
          {scans.map((scan, i) => (
            <div
              key={scan.id}
              className="animate-fade-in-up flex flex-col sm:flex-row gap-4 rounded-xl border border-[var(--color-border)] bg-white p-4 hover:border-[var(--color-primary)]/40 transition-colors"
              style={{
                animationDelay: `${i * 30}ms`,
                borderLeftWidth: "4px",
                borderLeftColor:
                  scan.prediction?.priority === "urgent"
                    ? "var(--color-urgent)"
                    : scan.prediction?.priority === "moderate"
                    ? "var(--color-moderate)"
                    : "var(--color-low)",
              }}
            >
              <Link href={`/scans/${scan.id}`} className="h-24 w-24 shrink-0 rounded-lg overflow-hidden bg-[var(--color-surface-hover)]">
                <AuthedScanImage scanId={scan.id} alt={scan.file_name} className="h-full w-full object-cover" />
              </Link>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  {scan.prediction && <PriorityBadge priority={scan.prediction.priority} pulse />}
                  <span className="text-xs text-[var(--color-text-dim)] font-[family-name:var(--font-jetbrains-mono)]">
                    {timeAgo(scan.created_at)}
                  </span>
                </div>
                <Link href={`/scans/${scan.id}`} className="block">
                  <p className="font-medium text-sm capitalize hover:text-[var(--color-primary)] transition-colors">
                    {scan.prediction?.predicted_class ?? "Prediction pending"}
                    {" — "}
                    <span className="text-[var(--color-text-dim)] font-normal">Scan #{scan.id}</span>
                  </p>
                </Link>
                {scan.prediction && (
                  <div className="mt-2 max-w-xs">
                    <ConfidenceBar value={scan.prediction.confidence} />
                  </div>
                )}
              </div>

              <div className="flex sm:flex-col gap-2 shrink-0 justify-end">
                <Link href={`/scans/${scan.id}`}>
                  <Button variant="secondary" size="sm" className="w-full">
                    Review
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  loading={clearingId === scan.id}
                  onClick={() => handleClear(scan.id)}
                  className="w-full"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Clear
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
