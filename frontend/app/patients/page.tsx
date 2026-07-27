"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, User, ArrowRight } from "lucide-react";
import AppShell from "@/components/AppShell";
import Modal from "@/components/Modal";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { Skeleton, EmptyState } from "@/components/Primitives";
import { patientsApi, type Patient, ApiError } from "@/lib/api";
import { useToast } from "@/components/Toast";

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [mrn, setMrn] = useState("");
  const [creating, setCreating] = useState(false);
  const { push } = useToast();

  const load = useCallback(async () => {
    try {
      setPatients(await patientsApi.list());
    } catch {
      push("error", "Couldn't load patients.");
    }
  }, [push]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await patientsApi.create({
        full_name: fullName,
        age: age ? Number(age) : undefined,
        sex: sex || undefined,
        medical_record_number: mrn || undefined,
      });
      setFullName(""); setAge(""); setSex(""); setMrn("");
      setModalOpen(false);
      push("success", "Patient added.");
      load();
    } catch (err) {
      push("error", err instanceof ApiError ? err.detail : "Couldn't add patient.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-[family-name:var(--font-manrope)] text-2xl font-bold">Patients</h1>
          <p className="text-sm text-[var(--color-text-dim)] mt-1">Manage patient records and scan history.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> New patient</Button>
      </div>

      {patients === null && (
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      )}

      {patients?.length === 0 && (
        <EmptyState
          icon={<User className="h-8 w-8" />}
          title="No patients yet"
          description="Add a patient record to start uploading scans."
          action={<Button onClick={() => setModalOpen(true)} size="sm"><Plus className="h-4 w-4" /> New patient</Button>}
        />
      )}

      {patients && patients.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {patients.map((p, i) => (
            <Link
              key={p.id}
              href={`/patients/${p.id}`}
              className="animate-fade-in-up group flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-white px-5 py-4 hover:border-[var(--color-primary)] transition-colors"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary-tint)] text-[var(--color-primary)] font-[family-name:var(--font-manrope)] font-semibold">
                  {p.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-sm">{p.full_name}</p>
                  <p className="text-xs text-[var(--color-text-dim)] font-[family-name:var(--font-jetbrains-mono)]">
                    {[p.age && `${p.age}y`, p.sex, p.medical_record_number].filter(Boolean).join(" · ") || "No details"}
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-[var(--color-text-dim)] group-hover:text-[var(--color-primary)] group-hover:translate-x-0.5 transition-all" />
            </Link>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New patient">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <Input id="full_name" label="Full name" placeholder="Patient name" value={fullName} onChange={(e) => setFullName(e.target.value)} autoFocus required />
          <div className="grid grid-cols-2 gap-3">
            <Input id="age" label="Age" type="number" placeholder="34" value={age} onChange={(e) => setAge(e.target.value)} />
            <Input id="sex" label="Sex" placeholder="M / F" value={sex} onChange={(e) => setSex(e.target.value)} />
          </div>
          <Input id="mrn" label="Medical record number (optional)" placeholder="MRN-00123" value={mrn} onChange={(e) => setMrn(e.target.value)} />
          <Button type="submit" loading={creating} className="w-full">Add patient</Button>
        </form>
      </Modal>
    </AppShell>
  );
}
