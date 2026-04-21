"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { getSupabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen flex items-center justify-center text-white/50">…</main>}>
      <Login />
    </Suspense>
  );
}

function Login() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("next") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!email.trim() || !password) return setErr("Email and password required");
    setBusy(true);
    const sb = getSupabase();
    const { error } = await sb.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (error) return setErr(error.message);
    router.replace(redirectTo);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm card-glow flex flex-col gap-4 pop-in">
        <div className="text-center">
          <div className="text-5xl mb-2">🎉</div>
          <h1 className="title text-3xl font-black holo-text">Welcome back</h1>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-white/70">Email</span>
            <input
              type="email"
              autoComplete="email"
              className="bg-white/5 border border-white/15 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-flame/50 focus:border-flame/40"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-white/70">Password</span>
            <input
              type="password"
              autoComplete="current-password"
              className="bg-white/5 border border-white/15 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-flame/50 focus:border-flame/40"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {err && <p className="text-rose-400 text-sm">{err}</p>}

          <button className="btn-primary mt-1" disabled={busy}>
            {busy ? "Signing in…" : "Log in"}
          </button>
        </form>

        <div className="flex items-center justify-between text-sm">
          <Link href="/auth/reset" className="text-white/60 hover:text-white">Forgot password?</Link>
          <Link href="/auth/signup" className="text-flame hover:underline">Create account</Link>
        </div>
        <Link href="/" className="text-center text-xs text-white/40 hover:text-white">← Back</Link>
      </div>
    </main>
  );
}
