"use client";
import { useStore } from "@/lib/store";
import { identities } from "@/lib/content/press-conference";
import { pickUnseen } from "@/lib/pick";
import { TurnBanner } from "@/components/TurnBanner";

type State = {
  subjectIndex: number;
  identity: string | null;
  phase: "idle" | "playing" | "reveal";
};

export function PressConference() {
  const { room, pid, gameAction } = useStore();
  const state = (room?.gameState || {}) as State;

  if (!room) return null;
  const subject = room.players[state.subjectIndex % room.players.length];
  const amSubject = pid === subject?.id;

  const draw = () => {
    const pool = identities[room.intensity];
    const poolKey = `press-conference:${room.intensity}`;
    const { item, index, poolSize } = pickUnseen(pool, room.bags?.[poolKey]);
    gameAction("draw", { identity: item, poolKey, index, poolSize });
  };

  return (
    <div className="flex flex-col gap-5 pop-in">
      <TurnBanner playerId={subject?.id} label="🎤 You're the interviewee" />
      <div className="card text-center">
        <div className="text-[10px] uppercase tracking-[0.3em] text-white/50">Subject of the press conference</div>
        <div className="title text-3xl font-black holo-text">{subject?.name}</div>
      </div>

      {state.phase === "idle" && (
        <>
          <p className="text-center text-white/70 text-sm">
            {amSubject
              ? "The press (everyone else) has picked a secret identity for you. Answer their questions as if you are that identity. Guess who you are."
              : "Pick a secret identity for the subject. They answer questions as if they are it — without knowing what it is."}
          </p>
          <button className="btn-primary h-28 text-lg title" onClick={draw} disabled={amSubject}>
            {amSubject ? "Wait for the press…" : "🎲 DRAW AN IDENTITY"}
          </button>
        </>
      )}

      {state.phase === "playing" && (
        <>
          {amSubject ? (
            <div className="card-glow border-white/30">
              <div className="text-[11px] uppercase tracking-[0.3em] text-flame font-bold">your job</div>
              <p className="text-lg font-bold mt-2 leading-snug">
                Answer the press's questions as if you are a secret identity. Use their questions to deduce who you are.
              </p>
              <p className="text-white/60 text-sm mt-3">
                When you want to guess, say it out loud. Group confirms.
              </p>
            </div>
          ) : (
            <div className="card-glow border-flame/40">
              <div className="text-[11px] uppercase tracking-[0.3em] text-flame font-bold">secret identity · hidden from {subject?.name}</div>
              <p className="text-xl font-bold mt-3 leading-snug">They are {state.identity}.</p>
              <p className="text-white/60 text-sm mt-3">
                Ask questions treating {subject?.name} as this identity. Don't make it too easy.
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-ghost" onClick={() => gameAction("reveal")}>🔓 Reveal</button>
            <button className="btn-primary" onClick={() => gameAction("next")}>Next subject →</button>
          </div>
        </>
      )}

      {state.phase === "reveal" && (
        <>
          <div className="card-glow pop-in">
            <div className="text-[11px] uppercase tracking-[0.3em] text-flame font-bold">the identity was</div>
            <p className="text-xl font-bold mt-3 leading-snug">{subject?.name} was {state.identity}.</p>
          </div>
          <button className="btn-primary" onClick={() => gameAction("next")}>Next subject →</button>
        </>
      )}
    </div>
  );
}
