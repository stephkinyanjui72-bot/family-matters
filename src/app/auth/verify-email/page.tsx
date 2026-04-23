"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getSupabase } from "@/lib/supabaseClient";
import { useT } from "@/lib/i18n/context";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<main className="min-h-screen flex items-center justify-center text-white/50">…</main>}>
      <VerifyEmail />
    </Suspense>
  );
}

function VerifyEmail() {
  const params = useSearchParams();
  const email = params.get("email") || "";
  const t = useT();
  const [resending, setResending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const resend = async () => {
    if (!email || cooldown > 0) return;
    setResending(true);
    setMsg(null);
    setErr(null);
    const sb = getSupabase();
    const { error } = await sb.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/verify-email` },
    });
    setResending(false);
    if (error) return setErr(error.message);
    setMsg(t("auth.resetSent"));
    setCooldown(60);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm card-glow flex flex-col gap-4 pop-in text-center">
        <div className="text-6xl">📬</div>
        <h1 className="title text-2xl font-black holo-text">{t("auth.verifyTitle")}</h1>
        <p className="text-white/70 text-sm">
          {t("auth.verifyBody", { email: email || "—" })}
        </p>

        {msg && <p className="text-emerald-300 text-sm">{msg}</p>}
        {err && <p className="text-rose-400 text-sm">{err}</p>}

        <button
          className="btn-ghost"
          onClick={resend}
          disabled={resending || !email || cooldown > 0}
        >
          {cooldown > 0 ? `${cooldown}s` : resending ? t("common.loading") : t("auth.resendEmail")}
        </button>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <Link href="/auth/login" className="btn-ghost !py-2 !text-sm">{t("auth.loginCta")}</Link>
          <Link href="/" className="btn-ghost !py-2 !text-sm">{t("footer.home")}</Link>
        </div>
      </div>
    </main>
  );
}
