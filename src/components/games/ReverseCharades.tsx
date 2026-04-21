"use client";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { prompts } from "@/lib/content/reverse-charades";
import { pickUnseen } from "@/lib/pick";
import { TurnBanner } from "@/components/TurnBanner";

type State = {
  guesserIndex: number;
  prompt: string | null;
  startedAt: number | null;
  outcome: "got" | "miss" | null;
};

const TIMER_MS = 60_000;

export function ReverseCharades() {
  const { room, pid, gameAction } = useStore();
  const [now, setNow] = useState(Date.now());
  const state = (room?.gameState || {}) as State;

  useEffect(() => {
    if (!state.startedAt || state.outcome) return;
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [state.startedAt, state.outcome]);

  if (!room) return null;
  const guesser = room.players[state.guesserIndex % room.players.length];
  const amGuesser = pid === guesser?.id;
  const elapsed = state.startedAt ? now - state.startedAt : 0;
  const remainingMs = Math.max(0, TIMER_MS - elapsed);
  const remainingSec = Math.ceil(remainingMs / 1000);
  const progress = Math.min(1, elapsed / TIMER_MS);

  const draw = () => {
    if (amGuesser) return; // guesser can't draw — they'd see it
    const pool = prompts[room.intensity];
    const poolKey = `reverse-charades:${room.intensity}`;
    const { item, index, poolSize } = pickUnseen(pool, room.bags?.[poolKey]);
    gameAction("draw", { prompt: item, poolKey, index, poolSize });
  };

  return (
    <div className="flex flex-col gap-5 pop-in">
      <TurnBanner playerId={guesser?.id} label="🎭 You're the guesser" />

      <div className="card text-center">
        <div className="text-[10px] uppercase tracking-[0.3em] text-white/50">Guesser</div>
        <div className="title text-3xl font-black holo-text">{guesser?.name}</div>
      </div>

      {!state.prompt && (
        <>
          <p className="text-center text-white/70 text-sm">
            Everyone else will act out a scene together. The guesser watches and guesses. 60-second timer.
          </p>
          <button
            className="btn-primary h-28 text-lg title"
            onClick={draw}
            disabled={amGuesser}
          >
            {amGuesser ? "Wait for the group to start…" : "🎲 DRAW A SCENE"}
          </button>
        </>
      )}

      {state.prompt && state.startedAt && !state.outcome && (
        <>
          {amGuesser ? (
            <div className="card-glow border-white/30">
              <div className="text-[11px] uppercase tracking-[0.3em] text-flame font-bold">watch & guess</div>
              <p className="text-sm text-white/70 mt-2">
                The group is acting out a scene. Call out guesses until you get it.
              </p>
            </div>
          ) : (
            <div className="card-glow border-flame/40">
              <div className="text-[11px] uppercase tracking-[0.3em] text-flame font-bold">scene · hidden from {guesser?.name}</div>
              <p className="title text-2xl font-black mt-2 leading-snug capitalize">{state.prompt}</p>
              <p className="text-white/60 text-xs mt-3">Act it out as a group. No talking. No pointing at words.</p>
            </div>
          )}

          <div className="flex justify-center py-2">
            <div className="relative w-28 h-28">
              <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
                <circle cx="50" cy="50" r="46" stroke="rgba(255,255,255,0.08)" strokeWidth="6" fill="none" />
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  stroke="url(#rcGrad)"
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 46}
                  strokeDashoffset={2 * Math.PI * 46 * progress}
                  style={{ transition: "stroke-dashoffset 200ms linear" }}
                />
                <defs>
                  <linearGradient id="rcGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#b46bff" />
                    <stop offset="100%" stopColor="#ff3d6e" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="title text-4xl font-black holo-text">{remainingSec}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button className="btn-ghost" onClick={() => gameAction("judge", { outcome: "miss" })}>
              🍺 Time's up / missed
            </button>
            <button className="btn-primary" onClick={() => gameAction("judge", { outcome: "got" })}>
              ✅ Got it!
            </button>
          </div>
        </>
      )}

      {state.outcome && (
        <div className={`card-glow pop-in text-center ${state.outcome === "got" ? "border-emerald-400/40" : "border-rose-500/40"}`}>
          <div className="text-5xl mb-2">{state.outcome === "got" ? "🎯" : "🍺"}</div>
          <div className="title text-xl font-black">
            {state.outcome === "got" ? `${guesser?.name} nailed it` : `${guesser?.name} drinks`}
          </div>
          <p className="text-white/70 text-sm mt-2">Scene: <b className="text-flame capitalize">{state.prompt}</b></p>
          <button className="btn-primary w-full mt-4" onClick={() => gameAction("next")}>
            Next guesser →
          </button>
        </div>
      )}
    </div>
  );
}
