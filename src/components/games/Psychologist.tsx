"use client";
import { useStore } from "@/lib/store";
import { rules } from "@/lib/content/psychologist";
import { pickUnseen } from "@/lib/pick";
import { TurnBanner } from "@/components/TurnBanner";

type State = {
  psychologistIndex: number;
  rule: string | null;
  phase: "idle" | "playing" | "reveal";
};

export function Psychologist() {
  const { room, pid, gameAction } = useStore();
  const state = (room?.gameState || {}) as State;

  if (!room) return null;
  const psychologist = room.players[state.psychologistIndex % room.players.length];
  const amPsychologist = pid === psychologist?.id;

  const draw = () => {
    const pool = rules[room.intensity];
    const poolKey = `psychologist:${room.intensity}`;
    const { item, index, poolSize } = pickUnseen(pool, room.bags?.[poolKey]);
    gameAction("draw", { rule: item, poolKey, index, poolSize });
  };

  return (
    <div className="flex flex-col gap-5 pop-in">
      <TurnBanner playerId={psychologist?.id} label="🛋️ You're the psychologist" />

      <div className="card text-center">
        <div className="text-[10px] uppercase tracking-[0.3em] text-white/50">Psychologist</div>
        <div className="title text-3xl font-black holo-text">{psychologist?.name}</div>
      </div>

      {state.phase === "idle" && (
        <>
          <p className="text-center text-white/70 text-sm leading-relaxed">
            {amPsychologist
              ? "Cover your ears for 10 seconds — the group is getting a secret rule. Then ask yes/no questions and guess the rule."
              : "Agree on or draw a secret rule without the psychologist hearing. Answer their yes/no questions using the rule."}
          </p>
          <button
            className="btn-primary h-32 text-xl title"
            onClick={draw}
            disabled={amPsychologist}
          >
            {amPsychologist ? "Wait for the group…" : "🎲 DRAW SECRET RULE"}
          </button>
        </>
      )}

      {state.phase === "playing" && (
        <>
          {amPsychologist ? (
            <div className="card-glow border-white/30">
              <div className="text-[11px] uppercase tracking-[0.3em] text-flame font-bold">your job</div>
              <p className="text-lg font-bold mt-2 leading-snug">
                Ask yes/no questions to the group. They'll answer based on a secret rule. Figure out the rule.
              </p>
              <p className="text-white/60 text-sm mt-3">
                When you want to guess, say it out loud. Group agrees or disagrees.
              </p>
            </div>
          ) : (
            <div className="card-glow border-flame/40">
              <div className="text-[11px] uppercase tracking-[0.3em] text-flame font-bold">secret rule · hidden from {psychologist?.name}</div>
              <p className="text-xl font-bold mt-3 leading-snug">{state.rule}</p>
              <p className="text-white/60 text-sm mt-3">
                Answer the psychologist's questions using this rule. Don't break character.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button className="btn-ghost" onClick={() => gameAction("reveal")}>
              🔓 Reveal rule
            </button>
            <button className="btn-primary" onClick={() => gameAction("next")}>
              Next psychologist →
            </button>
          </div>
        </>
      )}

      {state.phase === "reveal" && (
        <>
          <div className="card-glow pop-in">
            <div className="text-[11px] uppercase tracking-[0.3em] text-flame font-bold">the rule was</div>
            <p className="text-xl font-bold mt-3 leading-snug">{state.rule}</p>
          </div>
          <button className="btn-primary" onClick={() => gameAction("next")}>
            Next psychologist →
          </button>
        </>
      )}
    </div>
  );
}
