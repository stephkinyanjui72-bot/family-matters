"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { getSupabase } from "@/lib/supabaseClient";
import { useStore } from "@/lib/store";
import { PasswordField } from "@/components/PasswordField";
import { GoogleButton } from "@/components/GoogleButton";
import { Footer } from "@/components/Footer";

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
  const { authUser } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Redirect home once the auth store picks up a session — covers both
  // email/password (set synchronously by signInWithPassword) and native
  // Google (set asynchronously by the deep-link handler).
  useEffect(() => {
    if (authUser) router.replace(redirectTo);
  }, [authUser, redirectTo, router]);

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
    // The useEffect above will redirect as soon as authUser hydrates.
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
            <PasswordField
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
            />
          </label>

          {err && <p className="text-rose-400 text-sm">{err}</p>}

          <button className="btn-primary mt-1" disabled={busy}>
            {busy ? "Signing in…" : "Log in"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-1">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-[10px] uppercase tracking-widest text-white/40">or</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>
        <GoogleButton redirectTo={redirectTo} />

        <div className="flex items-center justify-between text-sm">
          <Link href="/auth/reset" className="text-white/60 hover:text-white">Forgot password?</Link>
          <Link href="/auth/signup" className="text-flame hover:underline">Create account</Link>
        </div>

        <div className="pt-3 mt-1 border-t border-white/10 text-center">
          <p className="text-xs text-white/50 mb-2">Just joining a friend's party?</p>
          <Link href="/?guest=1" className="btn-ghost !py-2 !text-sm inline-flex">
            📱 Join with a code
          </Link>
        </div>
        <Footer />
      </div>
    </main>
  );
}
