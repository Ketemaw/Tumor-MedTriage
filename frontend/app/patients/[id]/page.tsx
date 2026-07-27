"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ImageIcon, ArrowLeft } from "lucide-react";
import AppShell from "@/components/AppShell";
import UploadDropzone from "@/components/UploadDropzone";
import AuthedScanImage from "@/components/AuthedScanImage";
import { PriorityBadge, StatusBadge, ConfidenceBar, Skeleton, EmptyState } from "@/components/Primitives";
import { patientsApi, scansApi, type Patient, type Scan, ApiError } from "@/lib/api";
import { useToast } from "@/components/Toast";

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = Number(params.id);
  const { push } = useToast();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [scans, setScans] = useState<Scan[] | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    try {
      const [p, s] = await Promise.all([patientsApi.get(patientId), scansApi.listForPatient(patientId)]);
      setPatient(p);
      setScans(s);
    } catch {
      push("error", "Couldn't load patient.");
    }
  }, [patientId, push]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
  useEffect(() => {
    load();
  }, [load]);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const scan = await scansApi.upload(patientId, file);
      push(
        "success",
        scan.prediction
          ? `Analysis complete — ${scan.prediction.predicted_class} (${Math.round(scan.prediction.confidence * 100)}%)`
          : "Scan uploaded."
      );
      load();
    } catch (err) {
      push("error", err instanceof ApiError ? err.detail : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <AppShell>
      <button
        onClick={() => router.push("/patients")}
        className="flex items-center gap-1.5 text-sm text-[var(--color-text-dim)] hover:text-[var(--color-text)] mb-5"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to patients
      </button>

      <div className="mb-8">
        {patient ? (
          <>
            <h1 className="font-[family-name:var(--font-manrope)] text-2xl font-bold">{patient.full_name}</h1>
            <p className="text-sm text-[var(--color-text-dim)] mt-1 font-[family-name:var(--font-jetbrains-mono)]">
              {[patient.age && `${patient.age}y`, patient.sex, patient.medical_record_number].filter(Boolean).join(" · ") || "No additional details"}
            </p>
          </>
        ) : (
          <Skeleton className="h-8 w-56" />
        )}
      </div>

      <div className="mb-8">
        <UploadDropzone onUpload={handleUpload} uploading={uploading} />
      </div>

      <h2 className="font-[family-name:var(--font-manrope)] font-semibold text-sm mb-3 text-[var(--color-text-dim)] uppercase tracking-wide">
        Scan history
      </h2>

      {scans === null && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      )}

      {scans?.length === 0 && (
        <EmptyState
          icon={<ImageIcon className="h-8 w-8" />}
          title="No scans yet"
          description="Upload the patient's first scan above to get a triage assessment."
        />
      )}

      {scans && scans.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {scans.map((scan, i) => (
            <Link
              key={scan.id}
              href={`/scans/${scan.id}`}
              className="animate-fade-in-up group rounded-xl border border-[var(--color-border)] bg-white overflow-hidden hover:border-[var(--color-primary)] transition-colors"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div className="h-36 bg-[var(--color-surface-hover)]">
                <AuthedScanImage scanId={scan.id} alt={scan.file_name} className="h-full w-full object-cover" />
              </div>
              <div className="p-3.5">
                <div className="flex items-center justify-between mb-2">
                  {scan.prediction ? (
                    <PriorityBadge priority={scan.prediction.priority} />
                  ) : (
                    <span className="text-xs text-[var(--color-text-dim)]">No prediction</span>
                  )}
                  <StatusBadge status={scan.status} />
                </div>
                {scan.prediction && (
                  <>
                    <p className="text-sm font-medium capitalize mb-1.5">{scan.prediction.predicted_class}</p>
                    <ConfidenceBar value={scan.prediction.confidence} />
                  </>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
