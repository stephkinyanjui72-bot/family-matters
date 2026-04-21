"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import QRCode from "qrcode";
import { useStore } from "@/lib/store";
import { GAMES, CATEGORIES, type Category } from "@/lib/games";
import type { Intensity } from "@/lib/types";
import { GameScreen } from "@/components/GameScreen";
import { ExitSessionButton } from "@/components/ExitSessionButton";

const TIERS: { id: Intensity; label: string; tone: string }[] = [
  { id: "mild", label: "Mild", tone: "from-emerald-400 to-teal-400" },
  { id: "spicy", label: "Spicy", tone: "from-flame to-ember" },
  { id: "extreme", label: "Extreme", tone: "from-fuchsia-500 to-rose-500" },
  { id: "chaos", label: "Chaos 23+", tone: "from-rose-600 via-fuchsia-700 to-purple-700" },
];

export default function RoomPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const { room, me, isHost, connected, setIntensity, selectGame } = useStore();
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [joinUrl, setJoinUrl] = useState<string>("");
  const [filter, setFilter] = useState<Category | "all">("all");

  useEffect(() => {
    if (!room && typeof window !== "undefined") {
      // Came here without joining first — bounce home with prefill.
      const t = setTimeout(() => {
        if (!room) router.replace(`/?code=${params.code}`);
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [room, router, params.code]);

  useEffect(() => {
    if (!room) return;
    (async () => {
      try {
        const base = typeof window !== "undefined" ? window.location.origin : "";
        const url = `${base}/?code=${room.code}`;
        setJoinUrl(url);
        const dataUrl = await QRCode.toDataURL(url, {
          width: 320,
          margin: 1,
          color: { dark: "#ffffff", light: "#00000000" },
        });
        setQrDataUrl(dataUrl);
      } catch {}
    })();
  }, [room]);

  if (!room) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="text-white/60">Connecting…</div>
      </main>
    );
  }

  if (room.currentGame) return (
    <>
      <GameScreen />
      <ExitSessionButton />
    </>
  );

  const tier = TIERS.find((t) => t.id === room.intensity)!;

  return (
    <main className="min-h-screen p-6 max-w-2xl mx-auto flex flex-col gap-6">
      <header className="flex items-center justify-between pop-in">
        <div>
          <div className="flex items-center gap-2">
            <div className="text-[10px] uppercase tracking-[0.3em] text-white/50">Room code</div>
            <span className={`inline-flex items-center gap-1.5 chip text-[9px] ${connected ? "border-emerald-400/40 text-emerald-300" : "border-white/20 text-white/60"}`}>
              {connected ? (
                <>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  live
                </>
              ) : (
                <span
                  className="inline-block w-3 h-3 rounded-full border-[1.5px] border-white/15 border-t-flame border-r-ember animate-spin"
                  style={{ animationDuration: "0.9s" }}
                  aria-label="Reconnecting"
                />
              )}
            </span>
          </div>
          <div className="title text-4xl font-black tracking-[0.4em] holo-text">{room.code}</div>
        </div>
      </header>

      <section className="card-glow flex flex-col items-center gap-3">
        <div className="text-[10px] uppercase tracking-[0.3em] text-white/60">Scan to join · same WiFi</div>
        {qrDataUrl ? (
          <div className="qr-ring">
            <img
              src={qrDataUrl}
              alt="Join QR code"
              className="relative block w-56 h-56 rounded-[16px] bg-black p-3"
            />
          </div>
        ) : (
          <div className="w-56 h-56 bg-white/5 rounded-2xl animate-pulse" />
        )}
        <div className="text-[11px] text-white/60 text-center break-all font-mono">{joinUrl}</div>
        <button
          className="chip border-white/20 text-white/80 hover:text-white hover:border-white/40 transition"
          onClick={async () => {
            try { await navigator.clipboard.writeText(joinUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
          }}
        >
          {copied ? "✓ copied" : "📋 copy link"}
        </button>
      </section>

      <section className="card cyan-frame">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold">Players <span className="text-white/50 font-normal">({room.players.length})</span></h3>
          {me && <span className="text-xs text-white/50">You: {me.name}</span>}
        </div>
        <ul className="flex flex-wrap gap-2">
          {room.players.map((p) => (
            <li
              key={p.id}
              className={`chip flex items-center gap-1.5 ${
                !p.online
                  ? "border-white/10 text-white/40"
                  : p.isHost
                  ? "border-flame/60 text-flame"
                  : "border-white/20 text-white/80"
              }`}
            >
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${p.online ? (p.isHost ? "bg-flame" : "bg-emerald-400") : "bg-white/30"}`} />
              {p.name}{p.isHost && " · host"}{!p.online && " · offline"}
            </li>
          ))}
        </ul>
      </section>

      <section className="card cyan-frame">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold">Intensity</h3>
          <span className={`chip border-white/30 bg-gradient-to-r ${tier.tone} text-white`}>{tier.label}</span>
        </div>
        {isHost ? (
          <div className="grid grid-cols-2 gap-2">
            {TIERS.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  if (t.id === "chaos") {
                    const ok = typeof window !== "undefined" && localStorage.getItem("ageOK:23") === "1";
                    if (!ok) {
                      const confirm = window.confirm("Chaos mode is 23+ only. Everyone playing 23 or older and consenting?");
                      if (!confirm) return;
                      try { localStorage.setItem("ageOK:23", "1"); } catch {}
                    }
                  }
                  setIntensity(t.id);
                }}
                className={`rounded-xl py-2 text-sm font-semibold border transition ${
                  room.intensity === t.id
                    ? `bg-gradient-to-br ${t.tone} border-white/30 text-white`
                    : "bg-white/5 border-white/10 text-white/70"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-white/50 text-sm">Only the host changes the intensity.</p>
        )}
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="title text-xl font-black uppercase tracking-wider">Pick a Game</h3>
          <span className="text-[10px] uppercase tracking-widest text-white/40">{GAMES.length} games</span>
        </div>

        {/* Category filter row — horizontal scroll on narrow screens */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 mb-4">
          <button
            onClick={() => setFilter("all")}
            className={`cat-chip border-white/15 shrink-0 text-xs ${
              filter === "all"
                ? "cat-chip-active bg-gradient-to-br from-flame/80 to-ember/80"
                : "bg-white/5 text-white/75"
            }`}
          >
            All
          </button>
          {CATEGORIES.map((cat) => {
            const active = filter === cat.id;
            const count = GAMES.filter((g) => g.category === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setFilter(cat.id)}
                className={`cat-chip shrink-0 text-xs border-white/15 ${
                  active
                    ? `cat-chip-active bg-gradient-to-br ${cat.tone[0]} ${cat.tone[1]}`
                    : "bg-white/5 text-white/75"
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
                <span className={`ml-1 text-[10px] ${active ? "text-white/80" : "text-white/45"}`}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Game tiles — cartoon style with halo + confetti per card */}
        <div className="grid grid-cols-2 gap-3">
          {GAMES.filter((g) => filter === "all" || g.category === filter).map((g) => {
            const enabled = isHost && room.players.length >= g.minPlayers;
            const cat = CATEGORIES.find((c) => c.id === g.category)!;
            // per-category color map for accents (glow, halo, text)
            const catColor: Record<Category, { glow: string; halo: string; text: string; dot1: string; dot2: string }> = {
              spill:  { glow: "rgba(255, 61, 110, 0.38)", halo: "rgba(255,61,110,0.45)",  text: "rgb(var(--flame))", dot1: "#ff8a3d", dot2: "#ff3d6e" },
              sleuth: { glow: "rgba(180, 107, 255, 0.38)",halo: "rgba(180,107,255,0.45)", text: "rgb(var(--neon))",  dot1: "#b46bff", dot2: "#3debff" },
              quick:  { glow: "rgba(255, 138, 61, 0.40)", halo: "rgba(255,170,80,0.5)",   text: "rgb(var(--ember))", dot1: "#ffee5a", dot2: "#ff8a3d" },
              play:   { glow: "rgba(61, 235, 255, 0.35)", halo: "rgba(61,235,255,0.45)",  text: "rgb(var(--cyber))", dot1: "#3debff", dot2: "#4ade80" },
              mingle: { glow: "rgba(244, 63, 94, 0.42)",  halo: "rgba(244,63,94,0.5)",    text: "#fb7185",           dot1: "#fb7185", dot2: "#ff8a3d" },
            };
            const c = catColor[g.category];
            // Deterministic confetti positions derived from game id so each
            // tile has its own but stable doodle layout.
            const seed = g.id.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
            const dots = [
              { top: `${6 + (seed % 8)}%`,  left: `${72 + (seed % 9)}%`, size: 10, color: c.dot1, opacity: 0.55 },
              { top: `${70 + (seed % 12)}%`,left: `${8 + (seed % 10)}%`, size: 14, color: c.dot2, opacity: 0.45 },
              { top: `${38 + (seed % 7)}%`, left: `${88 - (seed % 8)}%`, size: 6,  color: c.dot1, opacity: 0.7  },
              { top: `${90 - (seed % 6)}%`, left: `${78 - (seed % 7)}%`, size: 8,  color: c.dot2, opacity: 0.5  },
              { top: `${20 + (seed % 6)}%`, left: `${6 + (seed % 5)}%`,  size: 5,  color: c.dot1, opacity: 0.6  },
            ];
            return (
              <button
                key={g.id}
                disabled={!enabled}
                onClick={() => selectGame(g.id)}
                data-disabled={!enabled}
                className={`tile tile-cartoon text-left p-4 ${enabled ? "" : "opacity-55"}`}
                style={{ ["--tile-glow-a" as string]: c.glow }}
              >
                <span className="tile-sheen" />
                {/* Scattered confetti dots */}
                {dots.map((d, i) => (
                  <span
                    key={i}
                    className="confetti-dot"
                    style={{ top: d.top, left: d.left, width: d.size, height: d.size, background: d.color, opacity: d.opacity }}
                  />
                ))}

                <div className="flex items-start justify-between relative">
                  <div className="text-[9px] uppercase tracking-widest font-bold" style={{ color: c.text }}>
                    {cat.emoji} {cat.label}
                  </div>
                </div>

                {/* Emoji halo — bright cartoon glow behind the icon */}
                <div className="mt-2 relative">
                  <div className="tile-halo" style={{ ["--halo-a" as string]: c.halo }}>
                    <span className="text-[38px] tile-emoji leading-none">{g.emoji}</span>
                  </div>
                </div>

                <div className="title font-black mt-3 text-base leading-tight relative">{g.name}</div>
                <div className="text-[11px] text-white/60 mt-1 leading-snug relative">{g.blurb}</div>

                <div className="mt-3 flex items-center justify-between relative">
                  <span className="chip border-white/15 text-white/65 text-[10px] !py-0.5">
                    {g.minPlayers}+ players
                  </span>
                  {!enabled && room.players.length < g.minPlayers && (
                    <span className="text-[9px] text-rose-400 uppercase tracking-wider font-bold">
                      🔒 needs {g.minPlayers - room.players.length} more
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        {!isHost && (
          <p className="text-center text-white/40 text-xs mt-4">Waiting for host to pick a game…</p>
        )}
      </section>
      <ExitSessionButton />
    </main>
  );
}
