"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabaseClient";
import { useT } from "@/lib/i18n/context";
import { PasswordField } from "@/components/PasswordField";

// Landing page for the password-reset email link. The URL arrives with a
// #access_token=…&refresh_token=…&type=recovery fragment. We establish the
// recovery session explicitly on mount so updateUser has a live session
// when the user submits.
export default function ResetConfirmPage() {
  const router = useRouter();
  const t = useT();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const sb = getSupabase();
      const hash = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
      if (hash) {
        const params = new URLSearchParams(hash);
        const access_token = params.get("access_token") || "";
        const refresh_token = params.get("refresh_token") || "";
        if (access_token && refresh_token) {
          const { error } = await sb.auth.setSession({ access_token, refresh_token });
          if (error) {
            setErr(`Couldn't start recovery session: ${error.message}`);
          }
          // Strip the hash so the tokens aren't shared / re-used.
          try {
            const clean = window.location.pathname + window.location.search;
            window.history.replaceState(null, "", clean);
          } catch {}
        }
      }
      // If there's still no session, surface a clear "expired link" message
      // up front instead of waiting for the user to hit Submit.
      const { data } = await sb.auth.getSession();
      if (!data.session) {
        setErr("This reset link has expired or already been used. Request a new one.");
      }
      setReady(true);
    })();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (password.length < 8) return setErr(t("profile.errPasswordShort"));
    if (password !== confirm) return setErr(t("profile.errPasswordsMismatch"));
    setBusy(true);
    const sb = getSupabase();
    const { error } = await sb.auth.updateUser({ password });
    setBusy(false);
    if (error) return setErr(error.message);
    try {
      window.dispatchEvent(new CustomEvent("native-auth-ok", { detail: "Password updated" }));
    } catch {}
    router.replace("/");
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm card-glow flex flex-col gap-4 pop-in">
        <div className="text-center">
          <div className="text-5xl mb-2">🔑</div>
          <h1 className="title text-2xl font-black holo-text">{t("auth.setNewPassword")}</h1>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-white/70">{t("profile.newPasswordPlaceholder")}</span>
            <PasswordField value={password} onChange={setPassword} autoComplete="new-password" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-white/70">{t("profile.confirmPasswordPlaceholder")}</span>
            <PasswordField value={confirm} onChange={setConfirm} autoComplete="new-password" />
          </label>
          {err && <p className="text-rose-400 text-sm">{err}</p>}
          <button className="btn-primary" disabled={busy || !ready}>
            {!ready ? t("common.loading") : busy ? t("profile.updating") : t("profile.updatePassword")}
          </button>
        </form>
        <Link href="/auth/reset" className="text-center text-xs text-white/40 hover:text-white">← {t("auth.resetTitle")}</Link>
      </div>
    </main>
  );
}
