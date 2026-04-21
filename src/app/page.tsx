"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { clearStoredSession, peekSession, useStore } from "@/lib/store";
import { isNativeApp } from "@/lib/platform";
import type { Intensity } from "@/lib/types";

const INTENSITIES: { id: Intensity; label: string; hint: string; tone: string }[] = [
  { id: "mild", label: "Mild", hint: "Warm-up vibes. Safe for any crowd.", tone: "from-emerald-400/70 to-teal-400/70" },
  { id: "spicy", label: "Spicy", hint: "Flirty, bold, suggestive.", tone: "from-flame to-ember" },
  { id: "extreme", label: "Extreme", hint: "No limits. Adults only.", tone: "from-fuchsia-500 to-rose-500" },
  { id: "chaos", label: "Chaos", hint: "Unfiltered. Chaotic. Intimate.", tone: "from-rose-600 via-fuchsia-700 to-purple-700" },
];

export default function HomePage() {
  return (
    <Suspense fallback={<main className="min-h-screen flex items-center justify-center text-white/50">Loading…</main>}>
      <Home />
    </Suspense>
  );
}

function Home() {
  const router = useRouter();
  const params = useSearchParams();
  const prefilled = params.get("code") || "";
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
    if (!inApp) return setError("Install the Android app to host a party");
    if (!name.trim()) return setError("Enter your name");
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
    if (!res.ok) return setError(res.error || "Could not host");
    if (res.code) router.push(`/room/${res.code}`);
  };

  // Pre-fill display name from profile when user is signed in.
  useEffect(() => {
    if (authUser?.displayName && !name) setName(authUser.displayName);
  }, [authUser, name]);

  // Intensity tiers available depend on age tier. Signup enforces 18+, so
  // every authenticated user gets all four tiers. Under-18 falls back to
  // mild only (defensive — they shouldn't reach host in the first place).
  const availableTiers: Intensity[] = (() => {
    if (!authUser) return ["mild", "spicy", "extreme", "chaos"]; // preview for unauth — host button redirects to login
    if (authUser.ageTier === "under-18") return ["mild"];
    return ["mild", "spicy", "extreme", "chaos"];
  })();

  const onJoin = async () => {
    if (!name.trim()) return setError("Enter your name");
    if (!code.trim()) return setError("Enter a room code");
    if (!joinerAdult) return setError("You must confirm you're 18 or older");
    setBusy(true);
    setError(null);
    const res = await joinRoom(code.trim().toUpperCase(), name.trim());
    setBusy(false);
    if (!res.ok) return setError(res.error || "Could not join");
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
                {authUser.ageTier === "under-18" ? "Mild only" : "All tiers"}
              </div>
              {!authUser.emailVerified && (
                <a href={`/auth/verify-email?email=${encodeURIComponent(authUser.email || "")}`} className="text-[11px] text-amber-300 hover:underline">
                  ⚠ Verify your email
                </a>
              )}
              <button className="btn-ghost !py-1.5 !text-xs" onClick={() => signOut()}>Sign out</button>
            </div>
          </details>
        ) : (
          <a href="/auth/login" className="chip border-flame/40 text-flame bg-flame/10">Log in</a>
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
          31 games · one wild night · 18+
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
              🎉 Host a Party
            </button>
          ) : (
            <a
              href="/download"
              className="btn-primary text-xl h-16 text-center flex flex-col justify-center leading-tight"
            >
              <span>📲 Host from the app</span>
              <span className="text-[11px] font-normal opacity-80 uppercase tracking-widest">get the Android app</span>
            </a>
          )}
          <button className="btn-ghost text-lg h-14" onClick={() => setMode("join")}>📱 Join with Code</button>
          {stuckCode && (
            <button
              className="text-center text-rose-300/80 text-xs mt-1 hover:text-rose-200 underline underline-offset-4"
              onClick={() => {
                clearStoredSession();
                setStuckCode(null);
              }}
            >
              ✕ Leave previous party ({stuckCode})
            </button>
          )}
          {!inApp && (
            <a href="/download" className="text-center text-white/50 text-sm mt-2 hover:text-white underline underline-offset-4">
              📲 Get the Android app
            </a>
          )}
          <p className="text-center text-white/40 text-xs mt-4 uppercase tracking-widest">
            host on any device · others scan the QR · works over the internet
          </p>
          <p className="text-center text-white/25 text-[10px] mt-1 font-mono">
            build {process.env.NEXT_PUBLIC_BUILD_SHA}
          </p>
        </div>
      )}

      {mode === "host" && (
        <div className="card-glow w-full max-w-sm flex flex-col gap-4 pop-in">
          <h2 className="title text-2xl font-black">Host a Party</h2>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-white/60">Your name</span>
            <input
              className="bg-white/5 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-flame/50"
              value={name}
              onChange={(e) => saveName(e.target.value)}
              maxLength={20}
              placeholder="e.g. Alex"
            />
          </label>
          <div className="flex flex-col gap-2">
            <span className="text-sm text-white/60">Intensity</span>
            <div className="grid grid-cols-2 gap-2">
              {INTENSITIES.filter((t) => availableTiers.includes(t.id)).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setIntensity(t.id)}
                  className={`rounded-xl py-3 text-sm font-semibold border transition ${
                    intensity === t.id
                      ? `bg-gradient-to-br ${t.tone} border-white/30 text-white`
                      : "bg-white/5 border-white/10 text-white/70"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-white/50">
              {availableTiers.includes(intensity)
                ? INTENSITIES.find((t) => t.id === intensity)?.hint
                : "—"}
            </p>
          </div>
          {error && <p className="text-rose-400 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button className="btn-ghost flex-1" onClick={() => setMode("start")}>Back</button>
            <button className="btn-primary flex-1" onClick={onHost} disabled={busy}>
              {busy ? "Creating…" : "Start"}
            </button>
          </div>
        </div>
      )}

      {mode === "join" && (
        <div className="card-glow w-full max-w-sm flex flex-col gap-4 pop-in">
          <h2 className="title text-2xl font-black">Join a Party</h2>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-white/60">Your name</span>
            <input
              className="bg-white/5 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-flame/50"
              value={name}
              onChange={(e) => saveName(e.target.value)}
              maxLength={20}
              placeholder="e.g. Alex"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-white/60">Room code</span>
            <input
              className="bg-white/5 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-flame/50 tracking-[0.4em] text-center text-2xl uppercase"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 4))}
              maxLength={4}
              placeholder="ABCD"
            />
          </label>
          <label className="flex items-start gap-2 text-xs text-white/70 cursor-pointer">
            <input
              type="checkbox"
              checked={joinerAdult}
              onChange={(e) => setJoinerAdult(e.target.checked)}
              className="mt-0.5 accent-flame w-4 h-4 shrink-0"
            />
            <span>
              I confirm I am <b>18 or older</b> and understand this room may contain adult content.
            </span>
          </label>
          {error && <p className="text-rose-400 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button className="btn-ghost flex-1" onClick={() => setMode("start")}>Back</button>
            <button className="btn-primary flex-1" onClick={onJoin} disabled={busy || !joinerAdult}>
              {busy ? "…" : "Join"}
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
                <p className="text-white/85 text-sm font-bold">Creating your party…</p>
                <p className="text-white/50 text-xs capitalize">{intensity} tier · shuffling the bag</p>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <div className="text-4xl mb-2">⚠️</div>
                  <h3 className="title text-2xl font-black">Host responsibility</h3>
                </div>
                <p className="text-sm text-white/80 leading-relaxed">
                  You're about to host a <b className="text-flame capitalize">{intensity}</b> tier session.
                  By starting this party you confirm that:
                </p>
                <ul className="text-sm text-white/80 flex flex-col gap-2 list-disc pl-5">
                  <li>Every player in the room is <b>18 or older</b>.</li>
                  <li>All players have consented to adult content in this session.</li>
                  <li>You take responsibility for who you invite and what happens during play.</li>
                </ul>
                <div className="grid grid-cols-2 gap-2">
                  <button className="btn-ghost" onClick={() => setShowLiabilityModal(false)}>
                    Cancel
                  </button>
                  <button className="btn-primary" onClick={onHost}>
                    Agree &amp; Start
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
