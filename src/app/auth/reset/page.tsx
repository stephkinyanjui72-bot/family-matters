"use client";
import { useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabaseClient";
import { isNativeApp } from "@/lib/platform";
import { NATIVE_SCHEME } from "@/lib/nativeAuth";
import { useT } from "@/lib/i18n/context";
import { Footer } from "@/components/Footer";

export default function ResetRequestPage() {
  const t = useT();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    if (!email.trim()) return setErr(t("auth.emailLabel"));
    setBusy(true);
    const sb = getSupabase();
    const redirectTo = isNativeApp()
      ? `${NATIVE_SCHEME}://auth/reset/confirm`
      : `${window.location.origin}/auth/reset/confirm`;
    const { error } = await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    setBusy(false);
    if (error) return setErr(error.message);
    setMsg(t("auth.resetSent"));
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm card-glow flex flex-col gap-4 pop-in">
        <div className="text-center">
          <div className="text-5xl mb-2">🔑</div>
          <h1 className="title text-2xl font-black holo-text">{t("auth.resetTitle")}</h1>
          <p className="text-white/60 text-xs mt-2">{t("auth.resetBody")}</p>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-white/70">{t("auth.emailLabel")}</span>
            <input
              type="email"
              autoComplete="email"
              className="bg-white/5 border border-white/15 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-flame/50 focus:border-flame/40"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          {msg && <p className="text-emerald-300 text-sm">{msg}</p>}
          {err && <p className="text-rose-400 text-sm">{err}</p>}
          <button className="btn-primary" disabled={busy}>{busy ? t("common.loading") : t("auth.setNewPassword")}</button>
        </form>
        <div className="flex items-center justify-between text-sm">
          <Link href="/auth/login" className="text-white/60 hover:text-white">← {t("auth.backToLogin")}</Link>
          <Link href="/auth/signup" className="text-flame hover:underline">{t("auth.signupCta")}</Link>
        </div>
        <Footer />
      </div>
    </main>
  );
}
