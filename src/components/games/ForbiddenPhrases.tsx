"use client";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { topics, forbidden as forbiddenPool } from "@/lib/content/forbidden-phrases";
import { pickUnseen } from "@/lib/pick";
import { TurnBanner } from "@/components/TurnBanner";

type State = {
  turnIndex: number;
  prompt: string | null;
  forbidden: [string, string] | null;
  startedAt: number | null;
  outcome: "caught" | "survived" | null;
};

const TIMER_MS = 30_000;

export function ForbiddenPhrases() {
  const { room, pid, gameAction } = useStore();
  const [now, setNow] = useState(Date.now());
  const state = (room?.gameState || {}) as State;

  useEffect(() => {
    if (!state.startedAt || state.outcome) return;
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [state.startedAt, state.outcome]);

  if (!room) return null;
  const speaker = room.players[state.turnIndex % room.players.length];
  const amSpeaker = pid === speaker?.id;
  const elapsed = state.startedAt ? now - state.startedAt : 0;
  const remainingMs = Math.max(0, TIMER_MS - elapsed);
  const remainingSec = Math.ceil(remainingMs / 1000);
  const progress = Math.min(1, elapsed / TIMER_MS);

  const draw = () => {
    if (!amSpeaker) return;
    const topicPool = topics[room.intensity];
    const forbiddenList = forbiddenPool[room.intensity];
    const topicKey = `forbidden-phrases-topic:${room.intensity}`;
    const wordKey = `forbidden-phrases-word:${room.intensity}`;

    const topicPick = pickUnseen(topicPool, room.bags?.[topicKey]);
    // Grab two distinct forbidden words.
    const firstWord = pickUnseen(forbiddenList, room.bags?.[wordKey]);
    const withFirst = [...(room.bags?.[wordKey] || []), firstWord.index];
    const secondWord = pickUnseen(forbiddenList, withFirst);

    gameAction("draw", {
      topic: topicPick.item,
      topicPoolKey: topicKey,
      topicIndex: topicPick.index,
      topicPoolSize: topicPick.poolSize,
      forbidden: [firstWord.item, secondWord.item],
      forbiddenPoolKey: wordKey,
      forbiddenIndex: secondWord.index,
      forbiddenPoolSize: secondWord.poolSize,
    });
  };

  return (
    <div className="flex flex-col gap-5 pop-in">
      <TurnBanner playerId={speaker?.id} label="Your round" />

      {!state.prompt && (
        <button className="btn-primary h-36 text-xl title" onClick={draw} disabled={!amSpeaker}>
          {amSpeaker ? "🤐 DRAW YOUR PROMPT" : `Waiting for ${speaker?.name}…`}
        </button>
      )}

      {state.prompt && state.forbidden && (
        <>
          <div className="card-glow">
            <div className="text-[11px] uppercase tracking-[0.3em] text-flame font-bold">topic</div>
            <p className="title text-2xl font-black mt-1">{state.prompt}</p>
          </div>

          <div className="card border-rose-500/30">
            <div className="text-[11px] uppercase tracking-[0.3em] text-rose-300 font-bold">forbidden words</div>
            <div className="flex flex-wrap gap-2 mt-2">
              {state.forbidden.map((w, i) => (
                <span key={i} className="chip border-rose-500/40 text-rose-200 bg-rose-500/10 line-through text-base">
                  {w}
                </span>
              ))}
            </div>
            <p className="text-white/60 text-xs mt-3">
              {amSpeaker
                ? "Talk about the topic for 30 seconds without saying either word."
                : `Listen carefully. Catch ${speaker?.name} if they slip.`}
            </p>
          </div>

          {state.startedAt && !state.outcome && (
            <div className="flex justify-center py-2">
              <div className="relative w-28 h-28">
                <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
                  <circle cx="50" cy="50" r="46" stroke="rgba(255,255,255,0.08)" strokeWidth="6" fill="none" />
                  <circle
                    cx="50"
                    cy="50"
                    r="46"
                    stroke="url(#fpGrad)"
                    strokeWidth="6"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 46}
                    strokeDashoffset={2 * Math.PI * 46 * progress}
                    style={{ transition: "stroke-dashoffset 200ms linear" }}
                  />
                  <defs>
                    <linearGradient id="fpGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#ff3d6e" />
                      <stop offset="100%" stopColor="#b46bff" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="title text-4xl font-black holo-text">{remainingSec}</span>
                </div>
              </div>
            </div>
          )}

          {!state.outcome && (
            <div className="grid grid-cols-2 gap-2">
              <button className="btn-ghost" onClick={() => gameAction("judge", { outcome: "caught" })}>
                🚨 Caught!
              </button>
              <button className="btn-primary" onClick={() => gameAction("judge", { outcome: "survived" })}>
                ✅ Survived
              </button>
            </div>
          )}

          {state.outcome && (
            <div className={`card-glow pop-in text-center ${state.outcome === "survived" ? "border-emerald-400/40" : "border-rose-500/40"}`}>
              <div className="text-5xl mb-2">{state.outcome === "survived" ? "🎯" : "🍺"}</div>
              <div className="title text-xl font-black">
                {state.outcome === "survived" ? `${speaker?.name} held the line` : `${speaker?.name} slipped — drink!`}
              </div>
              <button className="btn-primary w-full mt-4" onClick={() => gameAction("next")}>
                Next speaker →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
