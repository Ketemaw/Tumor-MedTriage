"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Activity } from "lucide-react";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { useAuthStore } from "@/store/authStore";
import { ApiError } from "@/lib/api";
import { useToast } from "@/components/Toast";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const { push } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      push("success", "Welcome back.");
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
          <h1 className="font-[family-name:var(--font-manrope)] text-xl font-bold">Sign in to MedTriage</h1>
          <p className="text-sm text-[var(--color-text-dim)] text-center">
            AI-assisted diagnostic triage for clinical teams.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
          <Input id="email" label="Email" type="email" placeholder="you@clinic.org" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input id="password" label="Password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p className="text-sm text-[var(--color-urgent)]">{error}</p>}
          <Button type="submit" loading={loading} className="w-full mt-1">Sign in</Button>
        </form>

        <p className="mt-5 text-center text-sm text-[var(--color-text-dim)]">
          No account?{" "}
          <Link href="/signup" className="text-[var(--color-primary)] hover:underline font-medium">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
