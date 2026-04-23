"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore, setPreviewAsTeen, peekPreviewAsTeen } from "@/lib/store";
import { getSupabase } from "@/lib/supabaseClient";
import { useT, RichText } from "@/lib/i18n/context";
import { PasswordField } from "@/components/PasswordField";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Footer } from "@/components/Footer";

export default function ProfilePage() {
  const router = useRouter();
  const t = useT();
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

  const [previewing, setPreviewing] = useState(false);
  useEffect(() => { setPreviewing(peekPreviewAsTeen()); }, []);

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
      setNameMsg(t("profile.nameInvalid"));
      return;
    }
    setNameBusy(true);
    setNameMsg(null);
    const sb = getSupabase();
    // Supabase-js without generated types loses the table shape and rejects
    // untyped update payloads; cast through unknown to sidestep.
    type ProfilesUpdate = {
      update: (v: Record<string, unknown>) => {
        eq: (k: string, v: string) => Promise<{ error: { message: string } | null }>;
      };
    };
    const table = sb.from("profiles") as unknown as ProfilesUpdate;
    const { error } = await table.update({ display_name: trimmed }).eq("id", authUser.id);
    setNameBusy(false);
    if (error) {
      setNameMsg(error.message);
      return;
    }
    setNameMsg(t("common.saved"));
    setTimeout(() => setNameMsg(null), 2000);
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwErr(null);
    setPwMsg(null);
    if (newPassword.length < 8) return setPwErr(t("profile.errPasswordShort"));
    if (newPassword !== confirmPassword) return setPwErr(t("profile.errPasswordsMismatch"));
    setPwBusy(true);
    const sb = getSupabase();
    const { error } = await sb.auth.updateUser({ password: newPassword });
    setPwBusy(false);
    if (error) return setPwErr(error.message);
    setNewPassword("");
    setConfirmPassword("");
    setPwMsg(t("profile.passwordUpdated"));
    setTimeout(() => setPwMsg(null), 3000);
  };

  const deleteAccount = async () => {
    const expected = t("profile.deletePlaceholder").toLowerCase();
    if (deleteTyped.trim().toLowerCase() !== expected) {
      setDeleteErr(t("profile.deleteErrTypeDelete"));
      return;
    }
    setDeleteBusy(true);
    setDeleteErr(null);
    const sb = getSupabase();
    const { data: { session } } = await sb.auth.getSession();
    if (!session?.access_token) {
      setDeleteBusy(false);
      setDeleteErr(t("profile.deleteErrSession"));
      return;
    }
    const res = await fetch("/api/profile/delete", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
    }).then((r) => r.json()).catch(() => ({ ok: false, error: t("common.networkError") }));
    if (!res?.ok) {
      setDeleteBusy(false);
      setDeleteErr(res?.error || t("profile.deleteErrGeneric"));
      return;
    }
    // Sign out locally and send them home.
    await sb.auth.signOut();
    router.replace("/");
  };

  if (authLoading || !authUser) {
    return (
      <main className="min-h-screen flex items-center justify-center text-white/60">
        {t("common.loading")}
      </main>
    );
  }

  const savedMsg = t("common.saved");

  return (
    <main className="min-h-screen max-w-md mx-auto p-6 flex flex-col gap-5">
      <header className="flex items-center justify-between pop-in">
        <Link href="/" className="text-white/60 text-sm hover:text-white">← {t("common.back")}</Link>
        <span className="chip border-white/15 text-white/60">{t("profile.headerChip")}</span>
      </header>

      <div className="text-center pop-in">
        <div className="text-5xl mb-2">👤</div>
        <h1 className="title text-3xl font-black holo-text">{t("profile.title")}</h1>
        <p className="text-white/60 text-xs mt-2 uppercase tracking-widest">
          {authUser.email}
          {!authUser.emailVerified && <span className="text-amber-300"> {t("profile.unverified")}</span>}
        </p>
      </div>

      {/* Display name */}
      <section className="card-glow flex flex-col gap-3">
        <div>
          <h2 className="font-bold">{t("profile.displayName")}</h2>
          <p className="text-white/50 text-xs">{t("profile.displayNameHint")}</p>
        </div>
        <form onSubmit={saveDisplayName} className="flex flex-col gap-2">
          <input
            className="bg-white/5 border border-white/15 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-flame/50 focus:border-flame/40"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={30}
          />
          {nameMsg && (
            <p className={`text-sm ${nameMsg === savedMsg ? "text-emerald-300" : "text-rose-400"}`}>
              {nameMsg}
            </p>
          )}
          <button className="btn-primary" disabled={nameBusy}>
            {nameBusy ? t("common.saving") : t("profile.saveName")}
          </button>
        </form>
      </section>

      {/* Change password */}
      <section className="card-glow flex flex-col gap-3">
        <div>
          <h2 className="font-bold">{t("profile.changePassword")}</h2>
          <p className="text-white/50 text-xs">{t("profile.passwordHint")}</p>
        </div>
        <form onSubmit={changePassword} className="flex flex-col gap-2">
          <PasswordField
            value={newPassword}
            onChange={setNewPassword}
            placeholder={t("profile.newPasswordPlaceholder")}
            autoComplete="new-password"
          />
          <PasswordField
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder={t("profile.confirmPasswordPlaceholder")}
            autoComplete="new-password"
          />
          {pwErr && <p className="text-rose-400 text-sm">{pwErr}</p>}
          {pwMsg && <p className="text-emerald-300 text-sm">{pwMsg}</p>}
          <button className="btn-primary" disabled={pwBusy || !newPassword || !confirmPassword}>
            {pwBusy ? t("profile.updating") : t("profile.updatePassword")}
          </button>
        </form>
      </section>

      {/* Language */}
      <section className="card-glow flex flex-col gap-3">
        <div>
          <h2 className="font-bold">{t("profile.language")}</h2>
          <p className="text-white/50 text-xs">{t("profile.languageHint")}</p>
        </div>
        <LanguageSwitcher />
      </section>

      {/* Age tier chip + sign out */}
      <section className="card flex items-center justify-between">
        <div>
          <h2 className="font-bold">{t("profile.ageTier")}</h2>
          <p className="text-white/50 text-xs mt-0.5">
            {authUser.ageTier === "under-18" ? t("profile.ageTierUnder18") : t("profile.ageTierAll")}
          </p>
        </div>
        <span className={`chip ${authUser.ageTier === "under-18" ? "border-rose-500/40 text-rose-300" : "border-emerald-400/40 text-emerald-300"}`}>
          {authUser.ageTier || "—"}
        </span>
      </section>

      {/* Preview as teen — UI-only switch for hosts to see the teen experience */}
      <section className="card border-amber-400/25">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-bold flex items-center gap-2">
              🌿 {t("profile.previewAsTeen")}
              {previewing && (
                <span className="chip border-amber-400/40 text-amber-300 !py-0.5 !px-2 text-[10px]">
                  {t("profile.previewOn")}
                </span>
              )}
            </h2>
            <p className="text-white/50 text-xs mt-1 leading-snug">
              {t("profile.previewAsTeenHint")}
            </p>
          </div>
        </div>
        <button
          className={`mt-3 w-full rounded-xl py-2 text-sm font-bold border transition ${
            previewing
              ? "border-amber-400/50 text-amber-200 bg-amber-400/10 hover:bg-amber-400/20"
              : "border-white/20 text-white/80 bg-white/5 hover:bg-white/10"
          }`}
          onClick={() => setPreviewAsTeen(!previewing)}
        >
          {previewing ? t("profile.previewTurnOff") : t("profile.previewAsTeen")}
        </button>
      </section>

      <button className="btn-ghost" onClick={() => signOut().then(() => router.replace("/"))}>
        {t("profile.signOut")}
      </button>

      {/* Delete account */}
      <section className="card border-rose-500/30">
        <h2 className="font-bold text-rose-300">{t("profile.dangerZone")}</h2>
        <p className="text-white/60 text-xs mt-1">
          {t("profile.deleteDesc")}
        </p>
        {!deleteOpen ? (
          <button
            className="mt-3 w-full rounded-xl py-2 text-sm font-bold border border-rose-500/40 text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 transition"
            onClick={() => setDeleteOpen(true)}
          >
            {t("profile.deleteAccount")}
          </button>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            <p className="text-sm text-white/80">
              <RichText text={t("profile.deleteConfirm")} />
            </p>
            <input
              className="bg-white/5 border border-rose-500/30 rounded-xl px-3 py-2 outline-none focus:ring-2 ring-rose-500/50"
              value={deleteTyped}
              onChange={(e) => setDeleteTyped(e.target.value)}
              placeholder={t("profile.deletePlaceholder")}
              autoComplete="off"
            />
            {deleteErr && <p className="text-rose-400 text-sm">{deleteErr}</p>}
            <div className="grid grid-cols-2 gap-2">
              <button
                className="btn-ghost !py-2 !text-sm"
                onClick={() => { setDeleteOpen(false); setDeleteTyped(""); setDeleteErr(null); }}
                disabled={deleteBusy}
              >
                {t("common.cancel")}
              </button>
              <button
                className="rounded-xl py-2 text-sm font-bold border border-rose-500/40 text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50"
                onClick={deleteAccount}
                disabled={deleteBusy}
              >
                {deleteBusy ? t("common.deleting") : t("profile.deletePermanent")}
              </button>
            </div>
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
