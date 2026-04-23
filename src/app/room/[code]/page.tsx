"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import QRCode from "qrcode";
import { clearStoredSession, useStore } from "@/lib/store";
import { GAMES, CATEGORIES, type Category } from "@/lib/games";
import type { Intensity } from "@/lib/types";
import { useT, RichText } from "@/lib/i18n/context";
import { GameScreen } from "@/components/GameScreen";
import { ExitSessionButton } from "@/components/ExitSessionButton";
import { SocialShareRow } from "@/components/SocialShareRow";

type TierStyle = {
  id: Intensity;
  emoji: string;
  // Gradient used when selected (Tailwind class string)
  tone: string;
  // Soft tinted background hint for unselected state
  hintBg: string;
  hintBorder: string;
  hintText: string;
};

const TIERS: TierStyle[] = [
  {
    id: "mild",
    emoji: "🌿",
    tone: "from-emerald-500 via-teal-500 to-cyan-500",
    hintBg: "bg-emerald-500/10",
    hintBorder: "border-emerald-400/30",
    hintText: "text-emerald-200",
  },
  {
    id: "spicy",
    emoji: "🌶️",
    tone: "from-flame via-ember to-yellow-400",
    hintBg: "bg-flame/10",
    hintBorder: "border-flame/40",
    hintText: "text-flame",
  },
  {
    id: "extreme",
    emoji: "🔥",
    tone: "from-fuchsia-600 via-pink-600 to-rose-500",
    hintBg: "bg-fuchsia-500/10",
    hintBorder: "border-fuchsia-400/40",
    hintText: "text-fuchsia-300",
  },
  {
    id: "chaos",
    emoji: "💀",
    tone: "from-purple-900 via-rose-800 to-red-900",
    hintBg: "bg-rose-900/20",
    hintBorder: "border-rose-700/50",
    hintText: "text-rose-300",
  },
];

export default function RoomPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const t = useT();
  const { room, me, isHost, connected, setIntensity, selectGame, authUser, kickPlayer } = useStore();
  const isTeen = authUser?.ageTier === "under-18";
  // For teen accounts, the app hides adult tiers AND adult-themed games
  // entirely — they don't see them anywhere in the UI.
  const visibleGames = isTeen ? GAMES.filter((g) => g.minorSafe) : GAMES;
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [joinUrl, setJoinUrl] = useState<string>("");
  const [filter, setFilter] = useState<Category | "all">("all");
  const [intensityAck, setIntensityAck] = useState(false);

  // If the room is an adult-tier (Extreme/Chaos) and the joiner hasn't
  // confirmed for THIS code yet, we show a blocking consent modal below.
  useEffect(() => {
    if (!room) return;
    const adult = room.intensity === "extreme" || room.intensity === "chaos";
    if (!adult) { setIntensityAck(true); return; }
    const key = `ack:${room.code}:${room.intensity}`;
    try {
      if (localStorage.getItem(key) === "1") setIntensityAck(true);
      else setIntensityAck(false);
    } catch {
      setIntensityAck(false);
    }
  }, [room?.code, room?.intensity]);

  const acceptIntensity = () => {
    if (!room) return;
    try { localStorage.setItem(`ack:${room.code}:${room.intensity}`, "1"); } catch {}
    setIntensityAck(true);
  };

  const declineIntensity = () => {
    clearStoredSession();
    router.replace("/");
  };

  useEffect(() => {
    if (!room && typeof window !== "undefined") {
      // Came here without joining first — bounce home with prefill.
      const id = setTimeout(() => {
        if (!room) router.replace(`/?code=${params.code}`);
      }, 1500);
      return () => clearTimeout(id);
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
        <div className="text-white/60">{t("room.connecting")}</div>
      </main>
    );
  }

  const tier = TIERS.find((x) => x.id === room.intensity)!;
  const tierLabel = t(`intensity.${tier.id}`);

  // Adult-tier consent gate — blocks the whole room view until accepted.
  const needsConsent = (room.intensity === "extreme" || room.intensity === "chaos") && !intensityAck;
  if (needsConsent) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-sm w-full card-glow flex flex-col gap-4 pop-in border-rose-500/40">
          <div className="text-center">
            <div className="text-4xl mb-2">{tier.emoji}</div>
            <h2 className="title text-2xl font-black">{t("room.adultTierTitle")}</h2>
          </div>
          <p className="text-sm text-white/80 leading-relaxed">
            <RichText text={t("room.adultTierDesc", { tier: tierLabel })} />
          </p>
          <ul className="text-sm text-white/80 flex flex-col gap-2 list-disc pl-5">
            <li><RichText text={t("room.consentBullet1")} /></li>
            <li><RichText text={t("room.consentBullet2")} /></li>
            <li><RichText text={t("room.consentBullet3")} /></li>
          </ul>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-ghost" onClick={declineIntensity}>{t("room.leave")}</button>
            <button className="btn-primary" onClick={acceptIntensity}>{t("room.agreeStay")}</button>
          </div>
        </div>
      </main>
    );
  }

  if (room.currentGame) return (
    <>
      <GameScreen />
      <ExitSessionButton />
    </>
  );

  return (
    <main className="min-h-screen p-6 max-w-2xl mx-auto flex flex-col gap-6">
      <header className="flex items-center justify-between pop-in">
        <div>
          <div className="flex items-center gap-2">
            <div className="text-[10px] uppercase tracking-[0.3em] text-white/50">{t("room.roomCodeLabel")}</div>
            <span className={`inline-flex items-center gap-1.5 chip text-[9px] ${connected ? "border-emerald-400/40 text-emerald-300" : "border-white/20 text-white/60"}`}>
              {connected ? (
                <>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {t("room.live")}
                </>
              ) : (
                <span
                  className="inline-block w-3 h-3 rounded-full border-[1.5px] border-white/15 border-t-flame border-r-ember animate-spin"
                  style={{ animationDuration: "0.9s" }}
                  aria-label={t("room.reconnecting")}
                />
              )}
            </span>
          </div>
          <div className="title text-4xl font-black tracking-[0.4em] holo-text">{room.code}</div>
        </div>
      </header>

      <section className="card-glow flex flex-col items-center gap-3">
        <div className="text-[10px] uppercase tracking-[0.3em] text-white/60">{t("room.scanToJoin")}</div>
        {qrDataUrl ? (
          <div className="qr-ring">
            <img
              src={qrDataUrl}
              alt={t("room.joinQrAlt")}
              className="relative block w-56 h-56 rounded-[16px] bg-black p-3"
            />
          </div>
        ) : (
          <div className="w-56 h-56 bg-white/5 rounded-2xl animate-pulse" />
        )}
        <div className="text-[11px] text-white/60 text-center break-all font-mono">{joinUrl}</div>
        <div className="flex gap-2">
          <button
            className="chip border-white/20 text-white/80 hover:text-white hover:border-white/40 transition"
            onClick={async () => {
              try { await navigator.clipboard.writeText(joinUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
            }}
          >
            {copied ? t("room.copied") : t("room.copyLink")}
          </button>
          {/* Web Share API: opens the native share sheet on mobile (WhatsApp,
              SMS, AirDrop, …). Falls back silently if unsupported (desktop). */}
          <button
            className="chip border-flame/40 text-flame bg-flame/10 hover:bg-flame/20 transition"
            onClick={async () => {
              const nav = typeof navigator !== "undefined" ? (navigator as unknown as { share?: (d: ShareData) => Promise<void> }) : undefined;
              if (nav?.share) {
                try {
                  await nav.share({
                    title: "Party Mate",
                    text: t("room.shareText", { code: room.code }),
                    url: joinUrl,
                  });
                } catch { /* user cancelled */ }
              } else {
                // Desktop fallback: copy to clipboard
                try {
                  await navigator.clipboard.writeText(joinUrl);
                  setCopied(true); setTimeout(() => setCopied(false), 1500);
                } catch {}
              }
            }}
          >
            {t("room.share")}
          </button>
        </div>
        <SocialShareRow url={joinUrl} text={t("room.shareText", { code: room.code })} />
      </section>

      <div className="section-frame">
        <section className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">{t("room.players")} <span className="text-white/50 font-normal">({room.players.length})</span></h3>
            {me && <span className="text-xs text-white/50">{t("room.youPrefix", { name: me.name })}</span>}
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
                <span>{p.name}{p.isHost && ` · ${t("room.hostSuffix")}`}{!p.online && ` · ${t("room.offlineSuffix")}`}</span>
                {/* Host can remove a disruptive non-host player. Hidden for
                    non-hosts and for the host's own chip. */}
                {isHost && !p.isHost && (
                  <button
                    aria-label={t("room.kickAria", { name: p.name })}
                    onClick={() => {
                      if (typeof window === "undefined") return;
                      const ok = window.confirm(t("room.kickConfirm", { name: p.name }));
                      if (ok) kickPlayer(p.id);
                    }}
                    className="ml-1 text-rose-400/80 hover:text-rose-300 text-[14px] leading-none"
                  >
                    ×
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {!isTeen && (
        <div className="section-frame">
          <section className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">{t("room.intensity")}</h3>
              <span className={`chip border-white/30 bg-gradient-to-r ${tier.tone} text-white`}>{tierLabel}</span>
            </div>
            {isHost ? (
              <div className="grid grid-cols-2 gap-2">
                {TIERS.map((x) => {
                  const active = room.intensity === x.id;
                  return (
                    <button
                      key={x.id}
                      onClick={() => setIntensity(x.id)}
                      className={`rounded-xl py-2.5 px-3 text-sm font-bold border-2 transition-all flex items-center justify-center gap-1.5 ${
                        active
                          ? `bg-gradient-to-br ${x.tone} border-white/40 text-white shadow-lg shadow-black/40`
                          : `${x.hintBg} ${x.hintBorder} ${x.hintText} hover:brightness-125`
                      }`}
                    >
                      <span className="text-base">{x.emoji}</span>
                      <span>{t(`intensity.${x.id}`)}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-white/50 text-sm">{t("room.hostOnlyIntensity")}</p>
            )}
          </section>
        </div>
      )}

      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="title text-xl font-black uppercase tracking-wider">{t("room.pickGame")}</h3>
          <span className="text-[10px] uppercase tracking-widest text-white/40">{t("room.gamesCount", { n: visibleGames.length })}</span>
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
            {t("room.all")}
          </button>
          {CATEGORIES.map((cat) => {
            const active = filter === cat.id;
            const count = visibleGames.filter((g) => g.category === cat.id).length;
            const catKey = `room.category${cat.id.charAt(0).toUpperCase()}${cat.id.slice(1)}`;
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
                <span>{t(catKey)}</span>
                <span className={`ml-1 text-[10px] ${active ? "text-white/80" : "text-white/45"}`}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Game tiles — cartoon style with halo + confetti per card */}
        <div className="grid grid-cols-2 gap-3">
          {visibleGames.filter((g) => filter === "all" || g.category === filter).map((g) => {
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
                    {cat.emoji} {t(`room.category${cat.id.charAt(0).toUpperCase()}${cat.id.slice(1)}`)}
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
                    {t("room.minPlayers", { n: g.minPlayers })}
                  </span>
                  {!enabled && room.players.length < g.minPlayers && (
                    <span className="text-[9px] text-rose-400 uppercase tracking-wider font-bold">
                      {t("room.needsMore", { n: g.minPlayers - room.players.length })}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        {!isHost && (
          <p className="text-center text-white/40 text-xs mt-4">{t("room.waitingHost")}</p>
        )}
      </section>
      <ExitSessionButton />
    </main>
  );
}
