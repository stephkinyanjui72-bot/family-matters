"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabaseClient";
import { useT } from "@/lib/i18n/context";
import { PasswordField } from "@/components/PasswordField";
import { GoogleButton } from "@/components/GoogleButton";
import { Footer } from "@/components/Footer";

// Minimum age to create an account. Under-18 accounts get a kid-safe
// version of the app (Mild tier only, adult games hidden); 18+ accounts
// unlock all tiers.
const MIN_AGE = 13;

function yearsSince(dob: string): number {
  const d = new Date(dob);
  if (isNaN(d.getTime())) return -1;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

export default function SignupPage() {
  const router = useRouter();
  const t = useT();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!displayName.trim()) return setErr(t("auth.displayNameLabel"));
    if (!email.trim()) return setErr(t("auth.emailLabel"));
    if (password.length < 8) return setErr(t("profile.errPasswordShort"));
    if (!birthdate) return setErr(t("auth.birthdateLabel"));
    const age = yearsSince(birthdate);
    if (age < 0) return setErr(t("auth.birthdateLabel"));
    if (age < MIN_AGE) return setErr(`${MIN_AGE}+`);
    if (!acceptedTerms) return setErr(t("auth.acceptTermsPre"));

    setBusy(true);
    const sb = getSupabase();
    const { data, error } = await sb.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/verify-email`,
        data: { display_name: displayName.trim(), birthdate },
      },
    });
    setBusy(false);
    if (error) return setErr(error.message);
    // Supabase returns a user even when email confirmation is required. If the
    // project has email confirmation OFF, the user is signed in immediately.
    if (data.session) router.replace("/");
    else router.replace(`/auth/verify-email?email=${encodeURIComponent(email.trim())}`);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm card-glow flex flex-col gap-4 pop-in">
        <div className="text-center">
          <div className="text-5xl mb-2">🎉</div>
          <h1 className="title text-3xl font-black holo-text">{t("auth.signupTitle")}</h1>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-white/70">{t("auth.displayNameLabel")}</span>
            <input
              className="bg-white/5 border border-white/15 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-flame/50 focus:border-flame/40"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={30}
              placeholder="Alex"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-white/70">{t("auth.emailLabel")}</span>
            <input
              type="email"
              autoComplete="email"
              className="bg-white/5 border border-white/15 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-flame/50 focus:border-flame/40"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-white/70">{t("auth.passwordLabel")}</span>
            <PasswordField
              value={password}
              onChange={setPassword}
              placeholder={t("profile.passwordHint")}
              autoComplete="new-password"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-white/70">{t("auth.birthdateLabel")}</span>
            <input
              type="date"
              className="bg-white/5 border border-white/15 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-flame/50 focus:border-flame/40"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
            />
          </label>

          <label className="flex items-start gap-2 text-xs text-white/70 cursor-pointer mt-1">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 accent-flame w-4 h-4 shrink-0"
            />
            <span>
              {t("auth.acceptTermsPre")}{" "}
              <Link href="/terms" className="text-flame hover:underline" target="_blank">{t("auth.terms")}</Link>
              {" "}{t("auth.and")}{" "}
              <Link href="/privacy" className="text-flame hover:underline" target="_blank">{t("auth.privacy")}</Link>.
            </span>
          </label>

          {err && <p className="text-rose-400 text-sm">{err}</p>}

          <button className="btn-primary mt-1" disabled={busy || !acceptedTerms}>
            {busy ? t("auth.creatingAccount") : t("auth.signupCta")}
          </button>
        </form>

        <div className="flex items-center gap-3 my-1">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-[10px] uppercase tracking-widest text-white/40">{t("auth.or")}</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>
        <GoogleButton redirectTo="/" />

        <div className="text-center text-sm text-white/60">
          {t("auth.alreadyHaveAccount")} <Link href="/auth/login" className="text-flame hover:underline">{t("auth.loginCta")}</Link>
        </div>
        <Footer />
      </div>
    </main>
  );
}
