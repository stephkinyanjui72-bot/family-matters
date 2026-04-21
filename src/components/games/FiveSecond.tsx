"use client";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { prompts } from "@/lib/content/five-second";
import { pickUnseen } from "@/lib/pick";
import { TurnBanner } from "@/components/TurnBanner";

type State = {
  turnIndex: number;
  prompt: string | null;
  startedAt: number | null;
  outcome: "pass" | "fail" | null;
};

const TIMER_MS = 5_000;

export function FiveSecond() {
  const { room, pid, gameAction } = useStore();
  const [now, setNow] = useState(Date.now());
  const state = (room?.gameState || {}) as State;

  // Drive a 60fps-ish render so the countdown ring animates smoothly.
  useEffect(() => {
    if (!state.startedAt || state.outcome) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [state.startedAt, state.outcome]);

  if (!room) return null;
  const current = room.players[state.turnIndex % room.players.length];
  const amCurrent = pid === current?.id;
  const elapsed = state.startedAt ? now - state.startedAt : 0;
  const remainingMs = Math.max(0, TIMER_MS - elapsed);
  const remainingSec = Math.ceil(remainingMs / 1000);
  const progress = Math.min(1, elapsed / TIMER_MS);

  const draw = () => {
    if (!amCurrent) return;
    const pool = prompts[room.intensity];
    const poolKey = `five-second:${room.intensity}`;
    const { item, index, poolSize } = pickUnseen(pool, room.bags?.[poolKey]);
    gameAction("draw", { prompt: item, poolKey, index, poolSize });
  };

  return (
    <div className="flex flex-col gap-5 pop-in">
      <TurnBanner playerId={current?.id} label="It's your 5 seconds" />

      {!state.prompt && (
        <button className="btn-primary h-40 text-2xl title" onClick={draw} disabled={!amCurrent}>
          {amCurrent ? "⏱️ START!" : `Waiting for ${current?.name}…`}
        </button>
      )}

      {state.prompt && (
        <>
          <div className="card-glow text-center">
            <div className="text-[11px] uppercase tracking-[0.3em] text-flame font-bold">prompt</div>
            <p className="title text-2xl font-black mt-2">{state.prompt}</p>
          </div>

          <div className="flex justify-center py-2">
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
                <circle cx="50" cy="50" r="46" stroke="rgba(255,255,255,0.08)" strokeWidth="6" fill="none" />
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  stroke="url(#fiveSecGrad)"
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 46}
                  strokeDashoffset={2 * Math.PI * 46 * progress}
                  style={{ transition: "stroke-dashoffset 100ms linear" }}
                />
                <defs>
                  <linearGradient id="fiveSecGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#ff3d6e" />
                    <stop offset="100%" stopColor="#ff8a3d" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="title text-5xl font-black holo-text">{remainingSec}</span>
              </div>
            </div>
          </div>

          {!state.outcome && (
            <div className="grid grid-cols-2 gap-2">
              <button className="btn-ghost" onClick={() => gameAction("judge", { outcome: "fail" })}>
                😩 Drank / blanked
              </button>
              <button className="btn-primary" onClick={() => gameAction("judge", { outcome: "pass" })}>
                ✅ Nailed it
              </button>
            </div>
          )}

          {state.outcome && (
            <div className={`card-glow pop-in text-center ${state.outcome === "pass" ? "border-emerald-400/40" : "border-rose-500/40"}`}>
              <div className="text-5xl mb-2">{state.outcome === "pass" ? "🎯" : "🍺"}</div>
              <div className="title text-xl font-black">
                {state.outcome === "pass" ? `${current?.name} survived` : `${current?.name} drinks`}
              </div>
              <button className="btn-primary w-full mt-4" onClick={() => gameAction("next")}>
                Next player →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
