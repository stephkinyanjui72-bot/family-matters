"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import QRCode from "qrcode";
import { useStore } from "@/lib/store";
import { GAMES } from "@/lib/games";
import type { Intensity } from "@/lib/types";
import { GameScreen } from "@/components/GameScreen";

const TIERS: { id: Intensity; label: string; tone: string }[] = [
  { id: "mild", label: "Mild", tone: "from-emerald-400 to-teal-400" },
  { id: "spicy", label: "Spicy", tone: "from-flame to-ember" },
  { id: "extreme", label: "Extreme", tone: "from-fuchsia-500 to-rose-500" },
  { id: "chaos", label: "Chaos 23+", tone: "from-rose-600 via-fuchsia-700 to-purple-700" },
];

export default function RoomPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const { room, me, isHost, connected, leaveRoom, setIntensity, selectGame } = useStore();
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [joinUrl, setJoinUrl] = useState<string>("");

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

  if (room.currentGame) return <GameScreen />;

  const tier = TIERS.find((t) => t.id === room.intensity)!;

  return (
    <main className="min-h-screen p-6 max-w-2xl mx-auto flex flex-col gap-6">
      <header className="flex items-center justify-between pop-in">
        <div>
          <div className="flex items-center gap-2">
            <div className="text-[10px] uppercase tracking-[0.3em] text-white/50">Room code</div>
            <span className={`inline-flex items-center gap-1 chip text-[9px] ${connected ? "border-emerald-400/40 text-emerald-300" : "border-rose-500/40 text-rose-400"}`}>
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-400" : "bg-rose-500 animate-pulse"}`} />
              {connected ? "live" : "reconnecting"}
            </span>
          </div>
          <div className="title text-4xl font-black tracking-[0.4em] holo-text">{room.code}</div>
        </div>
        <button className="text-white/60 text-sm underline hover:text-white" onClick={() => { leaveRoom(); router.replace("/"); }}>
          Leave
        </button>
      </header>

      <section className="card-glow flex flex-col items-center gap-3">
        <div className="text-[10px] uppercase tracking-[0.3em] text-white/60">Scan to join · same WiFi</div>
        {qrDataUrl ? (
          <div className="relative">
            <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-flame via-neon to-cyber blur-2xl opacity-30" />
            <img src={qrDataUrl} alt="Join QR code" className="relative w-56 h-56 rounded-2xl bg-black/40 p-3 border border-white/10" />
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

      <section className="card">
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

      <section className="card">
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
        <h3 className="title text-xl font-black mb-3 uppercase tracking-wider">Pick a Game</h3>
        <div className="grid grid-cols-2 gap-3">
          {GAMES.map((g) => {
            const enabled = isHost && room.players.length >= g.minPlayers;
            return (
              <button
                key={g.id}
                disabled={!enabled}
                onClick={() => selectGame(g.id)}
                className={`card text-left transition-all group ${
                  enabled ? "hover:-translate-y-1 hover:shadow-2xl hover:shadow-flame/30 hover:border-flame/40 active:scale-[0.97]" : "opacity-40 cursor-not-allowed"
                }`}
              >
                <div className="text-4xl group-hover:scale-110 transition-transform">{g.emoji}</div>
                <div className="title font-black mt-2 text-lg">{g.name}</div>
                <div className="text-xs text-white/60 mt-1 leading-snug">{g.blurb}</div>
                {room.players.length < g.minPlayers && (
                  <div className="text-[10px] text-rose-400 mt-2 uppercase tracking-wider">Needs {g.minPlayers}+ players</div>
                )}
              </button>
            );
          })}
        </div>
        {!isHost && (
          <p className="text-center text-white/40 text-xs mt-4">Waiting for host to pick a game…</p>
        )}
      </section>
    </main>
  );
}
