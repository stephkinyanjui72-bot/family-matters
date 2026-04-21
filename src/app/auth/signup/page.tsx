"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabaseClient";

// Minimum age to create an account. Chaos tier still requires 23+.
const MIN_AGE = 18;

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
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!displayName.trim()) return setErr("Pick a display name");
    if (!email.trim()) return setErr("Email required");
    if (password.length < 8) return setErr("Password must be at least 8 characters");
    if (!birthdate) return setErr("Birthdate required");
    const age = yearsSince(birthdate);
    if (age < 0) return setErr("Birthdate invalid");
    if (age < MIN_AGE) return setErr(`You must be ${MIN_AGE}+ to use Party Mate`);

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
          <h1 className="title text-3xl font-black holo-text">Create account</h1>
          <p className="text-white/60 text-xs mt-2 uppercase tracking-widest">Hosting requires sign-up · 18+</p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-white/70">Display name</span>
            <input
              className="bg-white/5 border border-white/15 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-flame/50 focus:border-flame/40"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={30}
              placeholder="Alex"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-white/70">Email</span>
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
            <span className="text-sm text-white/70">Password</span>
            <input
              type="password"
              autoComplete="new-password"
              className="bg-white/5 border border-white/15 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-flame/50 focus:border-flame/40"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-white/70">Birthdate</span>
            <input
              type="date"
              className="bg-white/5 border border-white/15 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-flame/50 focus:border-flame/40"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
            />
            <span className="text-[11px] text-white/45">18+ to sign up · 23+ unlocks Chaos tier</span>
          </label>

          {err && <p className="text-rose-400 text-sm">{err}</p>}

          <button className="btn-primary mt-1" disabled={busy}>
            {busy ? "Creating…" : "Create account"}
          </button>
        </form>

        <div className="text-center text-sm text-white/60">
          Already have an account? <Link href="/auth/login" className="text-flame hover:underline">Log in</Link>
        </div>
        <Link href="/" className="text-center text-xs text-white/40 hover:text-white">← Back</Link>
      </div>
    </main>
  );
}
