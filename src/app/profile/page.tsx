"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { getSupabase } from "@/lib/supabaseClient";
import { PasswordField } from "@/components/PasswordField";
import { Footer } from "@/components/Footer";

export default function ProfilePage() {
  const router = useRouter();
  const { authUser, authLoading, signOut } = useStore();

  const [displayName, setDisplayName] = useState("");
  const [nameMsg, setNameMsg] = useState<string | null>(null);
  const [nameBusy, setNameBusy] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwBusy, setPwBusy] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTyped, setDeleteTyped] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !authUser) router.replace("/auth/login?next=/profile");
  }, [authLoading, authUser, router]);

  useEffect(() => {
    if (authUser?.displayName) setDisplayName(authUser.displayName);
  }, [authUser]);

  const saveDisplayName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) return;
    const trimmed = displayName.trim();
    if (!trimmed || trimmed.length > 30) {
      setNameMsg("Name must be 1–30 characters");
      return;
    }
    setNameBusy(true);
    setNameMsg(null);
    const sb = getSupabase();
    const { error } = await sb
      .from("profiles")
      .update({ display_name: trimmed })
      .eq("id", authUser.id);
    setNameBusy(false);
    if (error) {
      setNameMsg(error.message);
      return;
    }
    setNameMsg("Saved ✓");
    setTimeout(() => setNameMsg(null), 2000);
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwErr(null);
    setPwMsg(null);
    if (newPassword.length < 8) return setPwErr("At least 8 characters");
    if (newPassword !== confirmPassword) return setPwErr("Passwords don't match");
    setPwBusy(true);
    const sb = getSupabase();
    const { error } = await sb.auth.updateUser({ password: newPassword });
    setPwBusy(false);
    if (error) return setPwErr(error.message);
    setNewPassword("");
    setConfirmPassword("");
    setPwMsg("Password updated ✓");
    setTimeout(() => setPwMsg(null), 3000);
  };

  const deleteAccount = async () => {
    if (deleteTyped.toLowerCase() !== "delete") {
      setDeleteErr("Type 'delete' to confirm");
      return;
    }
    setDeleteBusy(true);
    setDeleteErr(null);
    const sb = getSupabase();
    const { data: { session } } = await sb.auth.getSession();
    if (!session?.access_token) {
      setDeleteBusy(false);
      setDeleteErr("Session expired — log in again");
      return;
    }
    const res = await fetch("/api/profile/delete", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
    }).then((r) => r.json()).catch(() => ({ ok: false, error: "Network error" }));
    if (!res?.ok) {
      setDeleteBusy(false);
      setDeleteErr(res?.error || "Delete failed");
      return;
    }
    // Sign out locally and send them home.
    await sb.auth.signOut();
    router.replace("/");
  };

  if (authLoading || !authUser) {
    return (
      <main className="min-h-screen flex items-center justify-center text-white/60">
        Loading…
      </main>
    );
  }

  return (
    <main className="min-h-screen max-w-md mx-auto p-6 flex flex-col gap-5">
      <header className="flex items-center justify-between pop-in">
        <Link href="/" className="text-white/60 text-sm hover:text-white">← Back</Link>
        <span className="chip border-white/15 text-white/60">Profile</span>
      </header>

      <div className="text-center pop-in">
        <div className="text-5xl mb-2">👤</div>
        <h1 className="title text-3xl font-black holo-text">Your account</h1>
        <p className="text-white/60 text-xs mt-2 uppercase tracking-widest">
          {authUser.email}
          {!authUser.emailVerified && <span className="text-amber-300"> · unverified</span>}
        </p>
      </div>

      {/* Display name */}
      <section className="card-glow flex flex-col gap-3">
        <div>
          <h2 className="font-bold">Display name</h2>
          <p className="text-white/50 text-xs">Shown to other players in your rooms.</p>
        </div>
        <form onSubmit={saveDisplayName} className="flex flex-col gap-2">
          <input
            className="bg-white/5 border border-white/15 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-flame/50 focus:border-flame/40"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={30}
          />
          {nameMsg && (
            <p className={`text-sm ${nameMsg === "Saved ✓" ? "text-emerald-300" : "text-rose-400"}`}>
              {nameMsg}
            </p>
          )}
          <button className="btn-primary" disabled={nameBusy}>
            {nameBusy ? "Saving…" : "Save name"}
          </button>
        </form>
      </section>

      {/* Change password */}
      <section className="card-glow flex flex-col gap-3">
        <div>
          <h2 className="font-bold">Change password</h2>
          <p className="text-white/50 text-xs">At least 8 characters.</p>
        </div>
        <form onSubmit={changePassword} className="flex flex-col gap-2">
          <PasswordField
            value={newPassword}
            onChange={setNewPassword}
            placeholder="New password"
            autoComplete="new-password"
          />
          <PasswordField
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Confirm new password"
            autoComplete="new-password"
          />
          {pwErr && <p className="text-rose-400 text-sm">{pwErr}</p>}
          {pwMsg && <p className="text-emerald-300 text-sm">{pwMsg}</p>}
          <button className="btn-primary" disabled={pwBusy || !newPassword || !confirmPassword}>
            {pwBusy ? "Updating…" : "Update password"}
          </button>
        </form>
      </section>

      {/* Age tier chip + sign out */}
      <section className="card flex items-center justify-between">
        <div>
          <h2 className="font-bold">Age tier</h2>
          <p className="text-white/50 text-xs mt-0.5">
            {authUser.ageTier === "under-18" ? "Mild tier only" : "All tiers unlocked"}
          </p>
        </div>
        <span className={`chip ${authUser.ageTier === "under-18" ? "border-rose-500/40 text-rose-300" : "border-emerald-400/40 text-emerald-300"}`}>
          {authUser.ageTier || "—"}
        </span>
      </section>

      <button className="btn-ghost" onClick={() => signOut().then(() => router.replace("/"))}>
        Sign out
      </button>

      {/* Delete account */}
      <section className="card border-rose-500/30">
        <h2 className="font-bold text-rose-300">Danger zone</h2>
        <p className="text-white/60 text-xs mt-1">
          Deletes your account, profile, and any rooms you're hosting.
          Rooms you've joined as a guest stay intact.
        </p>
        {!deleteOpen ? (
          <button
            className="mt-3 w-full rounded-xl py-2 text-sm font-bold border border-rose-500/40 text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 transition"
            onClick={() => setDeleteOpen(true)}
          >
            Delete my account
          </button>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            <p className="text-sm text-white/80">
              Type <b className="text-rose-300">delete</b> to confirm. This is permanent.
            </p>
            <input
              className="bg-white/5 border border-rose-500/30 rounded-xl px-3 py-2 outline-none focus:ring-2 ring-rose-500/50"
              value={deleteTyped}
              onChange={(e) => setDeleteTyped(e.target.value)}
              placeholder="delete"
              autoComplete="off"
            />
            {deleteErr && <p className="text-rose-400 text-sm">{deleteErr}</p>}
            <div className="grid grid-cols-2 gap-2">
              <button
                className="btn-ghost !py-2 !text-sm"
                onClick={() => { setDeleteOpen(false); setDeleteTyped(""); setDeleteErr(null); }}
                disabled={deleteBusy}
              >
                Cancel
              </button>
              <button
                className="rounded-xl py-2 text-sm font-bold border border-rose-500/40 text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50"
                onClick={deleteAccount}
                disabled={deleteBusy}
              >
                {deleteBusy ? "Deleting…" : "Permanently delete"}
              </button>
            </div>
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
