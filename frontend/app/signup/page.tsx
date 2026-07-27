"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Activity, Stethoscope, ClipboardList } from "lucide-react";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { useAuthStore } from "@/store/authStore";
import { ApiError } from "@/lib/api";
import { useToast } from "@/components/Toast";

export default function SignupPage() {
  const router = useRouter();
  const signup = useAuthStore((s) => s.signup);
  const { push } = useToast();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"clinic_staff" | "radiologist">("clinic_staff");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signup(email, password, fullName || undefined, role);
      push("success", "Account created.");
      router.push("/queue");
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-[var(--color-bg)]">
      <div className="w-full max-w-sm animate-fade-in-up">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-primary-tint)] text-[var(--color-primary)]">
            <Activity className="h-5 w-5" />
          </div>
          <h1 className="font-[family-name:var(--font-manrope)] text-xl font-bold">Create your account</h1>
          <p className="text-sm text-[var(--color-text-dim)]">Join your clinical team.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
          <Input id="fullName" label="Full name" placeholder="Dr. Almaz Bekele" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Input id="email" label="Email" type="email" placeholder="you@clinic.org" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input id="password" label="Password" type="password" placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--color-text-dim)] uppercase tracking-wide">Role</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole("clinic_staff")}
                className={`flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-xs font-medium transition-colors ${
                  role === "clinic_staff"
                    ? "border-[var(--color-primary)] bg-[var(--color-primary-tint)] text-[var(--color-primary)]"
                    : "border-[var(--color-border)] text-[var(--color-text-dim)] hover:border-[var(--color-primary)]/40"
                }`}
              >
                <ClipboardList className="h-4 w-4" />
                Clinic Staff
              </button>
              <button
                type="button"
                onClick={() => setRole("radiologist")}
                className={`flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-xs font-medium transition-colors ${
                  role === "radiologist"
                    ? "border-[var(--color-primary)] bg-[var(--color-primary-tint)] text-[var(--color-primary)]"
                    : "border-[var(--color-border)] text-[var(--color-text-dim)] hover:border-[var(--color-primary)]/40"
                }`}
              >
                <Stethoscope className="h-4 w-4" />
                Radiologist
              </button>
            </div>
            <p className="text-[11px] text-[var(--color-text-dim)] mt-0.5">
              Clinic staff upload scans. Radiologists review the triage queue.
            </p>
          </div>

          {error && <p className="text-sm text-[var(--color-urgent)]">{error}</p>}
          <Button type="submit" loading={loading} className="w-full mt-1">Create account</Button>
        </form>

        <p className="mt-5 text-center text-sm text-[var(--color-text-dim)]">
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--color-primary)] hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
