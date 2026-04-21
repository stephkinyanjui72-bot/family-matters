"use client";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { prompts } from "@/lib/content/rapid-fire";
import { pickUnseen, shuffle } from "@/lib/pick";
import { TurnBanner } from "@/components/TurnBanner";

type State = {
  victimIndex: number;
  prompts: string[] | null;
  startedAt: number | null;
  outcome: "survived" | "drank" | null;
};

const TIMER_MS = 30_000;
const PROMPTS_PER_ROUND = 6;

export function RapidFire() {
  const { room, pid, gameAction } = useStore();
  const [now, setNow] = useState(Date.now());
  const state = (room?.gameState || {}) as State;

  useEffect(() => {
    if (!state.startedAt || state.outcome) return;
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [state.startedAt, state.outcome]);

  if (!room) return null;
  const victim = room.players[state.victimIndex % room.players.length];
  const amVictim = pid === victim?.id;
  const elapsed = state.startedAt ? now - state.startedAt : 0;
  const remainingMs = Math.max(0, TIMER_MS - elapsed);
  const remainingSec = Math.ceil(remainingMs / 1000);
  const progress = Math.min(1, elapsed / TIMER_MS);
  const currentPromptIdx = state.prompts
    ? Math.min(state.prompts.length - 1, Math.floor(elapsed / (TIMER_MS / state.prompts.length)))
    : 0;
  const currentPrompt = state.prompts?.[currentPromptIdx];

  const start = () => {
    if (!amVictim) return;
    const pool = prompts[room.intensity];
    const poolKey = `rapid-fire:${room.intensity}`;
    const { item, index, poolSize } = pickUnseen(pool, room.bags?.[poolKey]);
    // Take a shuffled slice starting from `item` to get distinct prompts.
    const shuffled = shuffle(pool).slice(0, PROMPTS_PER_ROUND);
    // Force the selected prompt first so bag tracking is meaningful.
    const withLead = [item, ...shuffled.filter((s) => s !== item)].slice(0, PROMPTS_PER_ROUND);
    gameAction("start", { prompts: withLead, poolKey, index, poolSize });
  };

  return (
    <div className="flex flex-col gap-5 pop-in">
      <TurnBanner playerId={victim?.id} label="🔫 You're on fire" />

      <div className="card-glow text-center relative overflow-hidden">
        <div className="absolute -inset-6 bg-gradient-to-br from-flame/40 via-rose-700/30 to-orange-600/30 blur-2xl pointer-events-none" />
        <div className="relative">
          <div className="text-[10px] uppercase tracking-[0.3em] text-white/60">Hot seat</div>
          <div className="title text-4xl font-black mt-1 holo-text">{victim?.name}</div>
        </div>
      </div>

      {!state.prompts && (
        <button className="btn-primary h-32 text-xl title" onClick={start} disabled={!amVictim}>
          {amVictim ? "🔫 START · 30 seconds" : `Waiting for ${victim?.name}…`}
        </button>
      )}

      {state.prompts && state.startedAt && !state.outcome && (
        <>
          <div className="flex justify-center py-2">
            <div className="relative w-28 h-28">
              <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
                <circle cx="50" cy="50" r="46" stroke="rgba(255,255,255,0.08)" strokeWidth="6" fill="none" />
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  stroke="url(#rfGrad)"
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 46}
                  strokeDashoffset={2 * Math.PI * 46 * progress}
                  style={{ transition: "stroke-dashoffset 200ms linear" }}
                />
                <defs>
                  <linearGradient id="rfGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#ff3d6e" />
                    <stop offset="100%" stopColor="#ff8a3d" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="title text-4xl font-black holo-text">{remainingSec}</span>
              </div>
            </div>
          </div>

          <div className="card-glow text-center pop-in" key={currentPromptIdx}>
            <div className="text-[11px] uppercase tracking-[0.3em] text-flame font-bold">question {currentPromptIdx + 1}/{state.prompts.length}</div>
            <p className="title text-2xl font-black mt-2 leading-snug">{currentPrompt}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button className="btn-ghost" onClick={() => gameAction("judge", { outcome: "drank" })}>
              🍺 Drank / skipped
            </button>
            <button className="btn-primary" onClick={() => gameAction("judge", { outcome: "survived" })}>
              ✅ Answered all
            </button>
          </div>
        </>
      )}

      {state.outcome && (
        <div className={`card-glow pop-in text-center ${state.outcome === "survived" ? "border-emerald-400/40" : "border-rose-500/40"}`}>
          <div className="text-5xl mb-2">{state.outcome === "survived" ? "🎯" : "🍺"}</div>
          <div className="title text-xl font-black">
            {state.outcome === "survived" ? `${victim?.name} survived the fire` : `${victim?.name} drinks`}
          </div>
          <button className="btn-primary w-full mt-4" onClick={() => gameAction("next")}>
            Next victim →
          </button>
        </div>
      )}
    </div>
  );
}
