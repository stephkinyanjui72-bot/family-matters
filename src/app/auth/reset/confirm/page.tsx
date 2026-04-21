"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabaseClient";
import { PasswordField } from "@/components/PasswordField";

// Landing page for the password-reset email link. Supabase places the user
// into a recovery session via the URL fragment; we just call updateUser.
export default function ResetConfirmPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (password.length < 8) return setErr("Password must be at least 8 characters");
    if (password !== confirm) return setErr("Passwords don't match");
    setBusy(true);
    const sb = getSupabase();
    const { error } = await sb.auth.updateUser({ password });
    setBusy(false);
    if (error) return setErr(error.message);
    router.replace("/");
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm card-glow flex flex-col gap-4 pop-in">
        <div className="text-center">
          <div className="text-5xl mb-2">🔑</div>
          <h1 className="title text-2xl font-black holo-text">New password</h1>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-white/70">New password</span>
            <PasswordField value={password} onChange={setPassword} autoComplete="new-password" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-white/70">Confirm</span>
            <PasswordField value={confirm} onChange={setConfirm} autoComplete="new-password" />
          </label>
          {err && <p className="text-rose-400 text-sm">{err}</p>}
          <button className="btn-primary" disabled={busy}>{busy ? "Updating…" : "Update password"}</button>
        </form>
        <Link href="/" className="text-center text-xs text-white/40 hover:text-white">← Back</Link>
      </div>
    </main>
  );
}
