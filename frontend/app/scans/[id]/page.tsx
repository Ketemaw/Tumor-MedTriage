"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, ClipboardCheck } from "lucide-react";
import AppShell from "@/components/AppShell";
import Button from "@/components/Button";
import AuthedScanImage from "@/components/AuthedScanImage";
import { PriorityBadge, StatusBadge, ConfidenceBar, Skeleton } from "@/components/Primitives";
import { scansApi, queueApi, type Scan, ApiError } from "@/lib/api";
import { useToast } from "@/components/Toast";

export default function ScanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const scanId = Number(params.id);
  const { push } = useToast();

  const [scan, setScan] = useState<Scan | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState<"reviewed" | "cleared" | null>(null);

  const load = useCallback(async () => {
    try {
      setScan(await scansApi.get(scanId));
    } catch {
      push("error", "Couldn't load scan.");
    }
  }, [scanId, push]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
  useEffect(() => {
    load();
  }, [load]);

  async function handleReview(status: "reviewed" | "cleared") {
    setSubmitting(status);
    try {
      const updated = await queueApi.review(scanId, status, notes || undefined);
      setScan(updated);
      push("success", status === "cleared" ? "Case cleared." : "Marked as reviewed.");
    } catch (err) {
      push("error", err instanceof ApiError ? err.detail : "Couldn't update scan.");
    } finally {
      setSubmitting(null);
    }
  }

  if (!scan) {
    return (
      <AppShell>
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </AppShell>
    );
  }

  let probabilities: Record<string, number> = {};
  try {
    if (scan.prediction) probabilities = JSON.parse(scan.prediction.all_probabilities);
  } catch {
    // ignore parse issues, show nothing
  }
  const sortedProbs = Object.entries(probabilities).sort((a, b) => b[1] - a[1]);

  return (
    <AppShell>
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-[var(--color-text-dim)] hover:text-[var(--color-text)] mb-5"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </button>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-manrope)] text-2xl font-bold">Scan #{scan.id}</h1>
          <p className="text-sm text-[var(--color-text-dim)] mt-1">{scan.file_name}</p>
        </div>
        <div className="flex items-center gap-2">
          {scan.prediction && <PriorityBadge priority={scan.prediction.priority} />}
          <StatusBadge status={scan.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Image */}
        <div className="rounded-xl border border-[var(--color-border)] bg-white overflow-hidden">
          <div className="aspect-square bg-[var(--color-surface-hover)]">
            <AuthedScanImage scanId={scan.id} alt={scan.file_name} className="h-full w-full object-contain" />
          </div>
        </div>

        {/* Analysis + review */}
        <div className="flex flex-col gap-5">
          {scan.prediction ? (
            <div className="rounded-xl border border-[var(--color-border)] bg-white p-5">
              <h2 className="font-[family-name:var(--font-manrope)] font-semibold text-sm mb-4 text-[var(--color-text-dim)] uppercase tracking-wide">
                Model assessment
              </h2>
              <p className="font-[family-name:var(--font-manrope)] text-xl font-bold capitalize mb-1">
                {scan.prediction.predicted_class}
              </p>
              <p className="text-xs text-[var(--color-text-dim)] mb-4">
                {Math.round(scan.prediction.confidence * 100)}% confidence
              </p>

              <div className="flex flex-col gap-3">
                {sortedProbs.map(([className, prob]) => (
                  <div key={className}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs capitalize text-[var(--color-text-dim)]">{className}</span>
                      <span className="text-xs font-[family-name:var(--font-jetbrains-mono)] text-[var(--color-text-dim)]">
                        {Math.round(prob * 100)}%
                      </span>
                    </div>
                    <ConfidenceBar value={prob} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--color-border)] bg-white p-5 text-sm text-[var(--color-text-dim)]">
              No prediction available for this scan.
            </div>
          )}

          {/* Review workflow */}
          <div className="rounded-xl border border-[var(--color-border)] bg-white p-5">
            <h2 className="font-[family-name:var(--font-manrope)] font-semibold text-sm mb-3 text-[var(--color-text-dim)] uppercase tracking-wide">
              Radiologist review
            </h2>

            {scan.status !== "pending" ? (
              <div className="flex items-start gap-2.5 rounded-lg bg-[var(--color-primary-tint)] p-3.5">
                <ClipboardCheck className="h-4 w-4 text-[var(--color-primary)] mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-[var(--color-primary)] capitalize">{scan.status}</p>
                  {scan.reviewed_at && (
                    <p className="text-xs text-[var(--color-text-dim)] mt-0.5">
                      {new Date(scan.reviewed_at).toLocaleString()}
                    </p>
                  )}
                  {scan.review_notes && <p className="text-sm mt-2">{scan.review_notes}</p>}
                </div>
              </div>
            ) : (
              <>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add clinical notes (optional)…"
                  rows={3}
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[var(--color-primary)] transition-colors mb-3 resize-none"
                />
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    loading={submitting === "reviewed"}
                    onClick={() => handleReview("reviewed")}
                    className="flex-1"
                  >
                    Mark reviewed
                  </Button>
                  <Button
                    loading={submitting === "cleared"}
                    onClick={() => handleReview("cleared")}
                    className="flex-1"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Clear case
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
