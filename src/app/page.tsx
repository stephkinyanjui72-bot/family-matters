"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { clearStoredSession, peekSession, useStore } from "@/lib/store";
import { isNativeApp } from "@/lib/platform";
import { useT, RichText } from "@/lib/i18n/context";
import { Footer } from "@/components/Footer";
import type { Intensity } from "@/lib/types";

const INTENSITY_IDS: Intensity[] = ["mild", "spicy", "extreme", "chaos"];
const INTENSITY_TONES: Record<Intensity, string> = {
  mild: "from-emerald-400/70 to-teal-400/70",
  spicy: "from-flame to-ember",
  extreme: "from-fuchsia-500 to-rose-500",
  chaos: "from-rose-600 via-fuchsia-700 to-purple-700",
};

export default function HomePage() {
  return (
    <Suspense fallback={<main className="min-h-screen flex items-center justify-center text-white/50">…</main>}>
      <Home />
    </Suspense>
  );
}

function Home() {
  const router = useRouter();
  const params = useSearchParams();
  const prefilled = params.get("code") || "";
  const t = useT();
  const { createRoom, joinRoom, room, authUser, authLoading, signOut } = useStore();

  const guest = params.get("guest") === "1";
  const [mode, setMode] = useState<"start" | "host" | "join">(prefilled ? "join" : "start");
  const [name, setName] = useState("");
  const [code, setCode] = useState(prefilled);
  const [intensity, setIntensity] = useState<Intensity>("spicy");
  const [joinerAdult, setJoinerAdult] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [stuckCode, setStuckCode] = useState<string | null>(null);
  const [inApp, setInApp] = useState(false);
  const [showLiabilityModal, setShowLiabilityModal] = useState(false);

  useEffect(() => {
    if (room) router.replace(`/room/${room.code}`);
  }, [room, router]);

  // Entry gate: unauthenticated users get sent to login, UNLESS they arrived
  // via a QR code (?code=XXXX) or explicitly chose the guest-join path
  // (?guest=1). Those two flows let people join without an account.
  useEffect(() => {
    if (authLoading) return;
    if (authUser) return;
    if (prefilled || guest) return;
    router.replace("/auth/login");
  }, [authLoading, authUser, prefilled, guest, router]);

  useEffect(() => {
    try {
      const cached = localStorage.getItem("party:name");
      if (cached) setName(cached);
    } catch {}
    // Surface any lingering session so the user can force-leave it even if
    // the auto-rejoin hasn't landed yet.
    const session = peekSession();
    if (session?.code) setStuckCode(session.code);
    setInApp(isNativeApp());
  }, []);

  // Once the store successfully connects, the stuck-session banner goes away.
  useEffect(() => {
    if (room) setStuckCode(null);
  }, [room]);

  const saveName = (n: string) => {
    setName(n);
    try {
      localStorage.setItem("party:name", n);
    } catch {}
  };

  const onHost = async () => {
    if (!authUser) {
      router.push("/auth/login?next=/");
      return;
    }
    if (!inApp) return setError(t("host.errAndroidOnly"));
    if (!name.trim()) return setError(t("host.errEnterName"));
    // Adult-tier rooms require an explicit host affirmation first.
    if ((intensity === "extreme" || intensity === "chaos") && !showLiabilityModal) {
      setShowLiabilityModal(true);
      return;
    }
    setBusy(true);
    setError(null);
    const res = await createRoom(name.trim(), intensity);
    setBusy(false);
    setShowLiabilityModal(false);
    if (!res.ok) return setError(res.error || t("host.errCouldNotHost"));
    if (res.code) router.push(`/room/${res.code}`);
  };

  // Pre-fill display name from profile when user is signed in.
  useEffect(() => {
    if (authUser?.displayName && !name) setName(authUser.displayName);
  }, [authUser, name]);

  // Force teen accounts onto Mild tier — they can't see or pick anything else.
  useEffect(() => {
    if (authUser?.ageTier === "under-18" && intensity !== "mild") setIntensity("mild");
  }, [authUser?.ageTier, intensity]);

  // Intensity tiers available depend on age tier. Signup enforces 18+, so
  // every authenticated user gets all four tiers. Under-18 falls back to
  // mild only (defensive — they shouldn't reach host in the first place).
  const availableTiers: Intensity[] = (() => {
    if (!authUser) return ["mild", "spicy", "extreme", "chaos"]; // preview for unauth — host button redirects to login
    if (authUser.ageTier === "under-18") return ["mild"];
    return ["mild", "spicy", "extreme", "chaos"];
  })();

  const onJoin = async () => {
    if (!name.trim()) return setError(t("host.errEnterName"));
    if (!code.trim()) return setError(t("join.errEnterCode"));
    // The 18+ checkbox is only required for guests (no authed user). For
    // authed users the server knows their age and gates automatically.
    if (!authUser && !joinerAdult) return setError(t("join.errMustConfirm"));
    setBusy(true);
    setError(null);
    const res = await joinRoom(code.trim().toUpperCase(), name.trim());
    setBusy(false);
    if (!res.ok) return setError(res.error || t("join.errCouldNotJoin"));
    router.push(`/room/${code.trim().toUpperCase()}`);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 gap-8 relative">
      {/* Auth chip — top-right corner */}
      <div className="absolute top-4 right-4 z-10">
        {authLoading ? null : authUser ? (
          <details className="relative">
            <summary className="chip border-white/20 text-white/75 bg-white/5 cursor-pointer list-none">
              👤 {authUser.displayName || authUser.email?.split("@")[0] || "me"}
            </summary>
            <div className="absolute right-0 mt-2 card !p-3 w-56 flex flex-col gap-2 text-sm">
              <div className="text-white/50 text-xs truncate">{authUser.email}</div>
              <div className="text-[10px] uppercase tracking-widest text-flame">
                {authUser.ageTier === "under-18" ? t("landing.teenModeChip") : t("landing.allTiersChip")}
              </div>
              {!authUser.emailVerified && (
                <a href={`/auth/verify-email?email=${encodeURIComponent(authUser.email || "")}`} className="text-[11px] text-amber-300 hover:underline">
                  {t("landing.verifyEmailBanner")}
                </a>
              )}
              <a href="/profile" className="btn-ghost !py-1.5 !text-xs text-center">👤 {t("landing.profile")}</a>
              <button className="btn-ghost !py-1.5 !text-xs" onClick={() => signOut()}>{t("landing.signOut")}</button>
            </div>
          </details>
        ) : (
          <a href="/auth/login" className="chip border-flame/40 text-flame bg-flame/10">{t("landing.login")}</a>
        )}
      </div>

      <div className="text-center pop-in relative">
        {/* Floating emoji halo around the wordmark */}
        <div className="pointer-events-none absolute inset-x-0 -top-6 flex justify-center gap-8 text-2xl opacity-60 select-none">
          <span style={{ animation: "drift 5s ease-in-out infinite" }}>🎉</span>
          <span style={{ animation: "drift 6s ease-in-out infinite 0.5s" }}>💋</span>
          <span style={{ animation: "drift 7s ease-in-out infinite 1s" }}>🔥</span>
          <span style={{ animation: "drift 8s ease-in-out infinite 1.5s" }}>🍾</span>
        </div>
        <h1 className="wordmark holo-text text-[56px] sm:text-[72px] leading-[0.85] mt-6">
          PARTY<br/>MATE
        </h1>
        <p className="text-white/60 mt-3 uppercase tracking-[0.35em] text-[10px] font-bold">
          {authUser?.ageTier === "under-18" ? t("landing.taglineTeen") : t("landing.taglineAdult")}
        </p>
      </div>

      {mode === "start" && (
        <div className="w-full max-w-sm flex flex-col gap-3 pop-in">
          {inApp ? (
            <button
              className="btn-primary text-xl h-16"
              onClick={() => {
                if (!authUser && !authLoading) {
                  router.push("/auth/login?next=/");
                  return;
                }
                setMode("host");
              }}
            >
              {t("landing.hostCta")}
            </button>
          ) : (
            <a
              href="/download"
              className="btn-primary text-xl h-16 text-center flex flex-col justify-center leading-tight"
            >
              <span>{t("landing.hostFromApp")}</span>
              <span className="text-[11px] font-normal opacity-80 uppercase tracking-widest">{t("landing.hostFromAppHint")}</span>
            </a>
          )}
          <button className="btn-ghost text-lg h-14" onClick={() => setMode("join")}>{t("landing.joinCta")}</button>
          {stuckCode && (
            <button
              className="text-center text-rose-300/80 text-xs mt-1 hover:text-rose-200 underline underline-offset-4"
              onClick={() => {
                clearStoredSession();
                setStuckCode(null);
              }}
            >
              {t("landing.leavePrevious", { code: stuckCode })}
            </button>
          )}
          {!inApp && (
            <a href="/download" className="text-center text-white/50 text-sm mt-2 hover:text-white underline underline-offset-4">
              {t("landing.downloadAndroid")}
            </a>
          )}
          <p className="text-center text-white/40 text-xs mt-4 uppercase tracking-widest">
            {t("landing.helperLine")}
          </p>
          <Footer />
        </div>
      )}

      {mode === "host" && (
        <div className="card-glow w-full max-w-sm flex flex-col gap-4 pop-in">
          <h2 className="title text-2xl font-black">{t("host.title")}</h2>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-white/60">{t("host.nameLabel")}</span>
            <input
              className="bg-white/5 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-flame/50"
              value={name}
              onChange={(e) => saveName(e.target.value)}
              maxLength={20}
              placeholder={t("host.namePlaceholder")}
            />
          </label>
          {authUser?.ageTier === "under-18" ? (
            // Teen accounts: no intensity choice — always Mild, not even mentioned.
            <p className="text-xs text-white/50 uppercase tracking-widest text-center">
              {t("host.teenOnlyLine")}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              <span className="text-sm text-white/60">{t("host.intensityLabel")}</span>
              <div className="grid grid-cols-2 gap-2">
                {INTENSITY_IDS.filter((id) => availableTiers.includes(id)).map((id) => (
                  <button
                    key={id}
                    onClick={() => setIntensity(id)}
                    className={`rounded-xl py-3 text-sm font-semibold border transition ${
                      intensity === id
                        ? `bg-gradient-to-br ${INTENSITY_TONES[id]} border-white/30 text-white`
                        : "bg-white/5 border-white/10 text-white/70"
                    }`}
                  >
                    {t(`intensity.${id}`)}
                  </button>
                ))}
              </div>
              <p className="text-xs text-white/50">
                {availableTiers.includes(intensity) ? t(`intensity.${intensity}Hint`) : "—"}
              </p>
            </div>
          )}
          {error && <p className="text-rose-400 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button className="btn-ghost flex-1" onClick={() => setMode("start")}>{t("common.back")}</button>
            <button className="btn-primary flex-1" onClick={onHost} disabled={busy}>
              {busy ? t("host.creating") : t("host.startBtn")}
            </button>
          </div>
        </div>
      )}

      {mode === "join" && (
        <div className="card-glow w-full max-w-sm flex flex-col gap-4 pop-in">
          <h2 className="title text-2xl font-black">{t("join.title")}</h2>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-white/60">{t("host.nameLabel")}</span>
            <input
              className="bg-white/5 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-flame/50"
              value={name}
              onChange={(e) => saveName(e.target.value)}
              maxLength={20}
              placeholder={t("host.namePlaceholder")}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-white/60">{t("join.codeLabel")}</span>
            <input
              className="bg-white/5 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-flame/50 tracking-[0.4em] text-center text-2xl uppercase"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 4))}
              maxLength={4}
              placeholder={t("join.codePlaceholder")}
            />
          </label>
          {authUser ? (
            // Authed users: age is on file, server gates automatically.
            authUser.ageTier === "under-18" ? (
              <p className="text-[11px] text-white/50">
                {t("join.teenHint")}
              </p>
            ) : null
          ) : (
            <label className="flex items-start gap-2 text-xs text-white/70 cursor-pointer">
              <input
                type="checkbox"
                checked={joinerAdult}
                onChange={(e) => setJoinerAdult(e.target.checked)}
                className="mt-0.5 accent-flame w-4 h-4 shrink-0"
              />
              <span><RichText text={t("join.adultConfirm")} /></span>
            </label>
          )}
          {error && <p className="text-rose-400 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button className="btn-ghost flex-1" onClick={() => setMode("start")}>{t("common.back")}</button>
            <button
              className="btn-primary flex-1"
              onClick={onJoin}
              disabled={busy || (!authUser && !joinerAdult)}
            >
              {busy ? t("join.joining") : t("join.joinBtn")}
            </button>
          </div>
        </div>
      )}

      {/* Host liability modal — shown for Extreme / Chaos tiers at Start */}
      {showLiabilityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="card-glow max-w-sm w-full flex flex-col gap-4 pop-in border-rose-500/40">
            {busy ? (
              <div className="flex flex-col items-center gap-3 py-6">
                <div className="relative w-14 h-14">
                  <div className="absolute inset-0 rounded-full border-4 border-white/10" />
                  <div
                    className="absolute inset-0 rounded-full border-4 border-transparent animate-spin"
                    style={{
                      borderTopColor: "rgb(var(--flame))",
                      borderRightColor: "rgb(var(--ember))",
                      animationDuration: "0.8s",
                    }}
                  />
                </div>
                <p className="text-white/85 text-sm font-bold">{t("liability.creatingTitle")}</p>
                <p className="text-white/50 text-xs">{t("liability.shuffling", { tier: t(`intensity.${intensity}`) })}</p>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <div className="text-4xl mb-2">⚠️</div>
                  <h3 className="title text-2xl font-black">{t("liability.title")}</h3>
                </div>
                <p className="text-sm text-white/80 leading-relaxed">
                  <RichText text={t("liability.intro", { tier: t(`intensity.${intensity}`) })} />
                </p>
                <ul className="text-sm text-white/80 flex flex-col gap-2 list-disc pl-5">
                  <li><RichText text={t("liability.bullet1")} /></li>
                  <li><RichText text={t("liability.bullet2")} /></li>
                  <li><RichText text={t("liability.bullet3")} /></li>
                </ul>
                <div className="grid grid-cols-2 gap-2">
                  <button className="btn-ghost" onClick={() => setShowLiabilityModal(false)}>
                    {t("common.cancel")}
                  </button>
                  <button className="btn-primary" onClick={onHost}>
                    {t("liability.agreeStart")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
