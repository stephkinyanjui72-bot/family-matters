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

  const [mode, setMode] = useState<"start" | "host" | "join">(prefilled ? "join" : "start");
  const [name, setName] = useState("");
  const [code, setCode] = useState(prefilled);
  const [intensity, setIntensity] = useState<Intensity>("spicy");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [stuckCode, setStuckCode] = useState<string | null>(null);
  const [inApp, setInApp] = useState(false);

  useEffect(() => {
    if (room) router.replace(`/room/${room.code}`);
  }, [room, router]);

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
    if (!name.trim()) return setError("Enter your name");
    setBusy(true);
    setError(null);
    const res = await createRoom(name.trim(), intensity);
    setBusy(false);
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
              {busy ? "…" : "Start"}
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
          {error && <p className="text-rose-400 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button className="btn-ghost flex-1" onClick={() => setMode("start")}>Back</button>
            <button className="btn-primary flex-1" onClick={onJoin} disabled={busy}>
              {busy ? "…" : "Join"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
