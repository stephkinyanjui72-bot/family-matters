"use client";
import { useStore } from "@/lib/store";
import { reasons } from "@/lib/content/sorry-im-late";
import { pickUnseen } from "@/lib/pick";
import { TurnBanner } from "@/components/TurnBanner";

type State = {
  lateIndex: number;
  reason: string | null;
  phase: "idle" | "playing" | "reveal";
};

export function SorryImLate() {
  const { room, pid, gameAction } = useStore();
  const state = (room?.gameState || {}) as State;

  if (!room) return null;
  const late = room.players[state.lateIndex % room.players.length];
  const amLate = pid === late?.id;

  const draw = () => {
    const pool = reasons[room.intensity];
    const poolKey = `sorry-im-late:${room.intensity}`;
    const { item, index, poolSize } = pickUnseen(pool, room.bags?.[poolKey]);
    gameAction("draw", { reason: item, poolKey, index, poolSize });
  };

  return (
    <div className="flex flex-col gap-5 pop-in">
      <TurnBanner playerId={late?.id} label="🚪 You're the late one" />
      <div className="card text-center">
        <div className="text-[10px] uppercase tracking-[0.3em] text-white/50">Arriving dramatically late</div>
        <div className="title text-3xl font-black holo-text">{late?.name}</div>
      </div>

      {state.phase === "idle" && (
        <>
          <p className="text-center text-white/70 text-sm">
            {amLate
              ? "Everyone else knows WHY you're late. You don't. You'll improvise your explanation while they ask leading questions. Try to piece together what happened to you."
              : "Pick a ridiculous reason for their lateness. They'll improvise, so ask leading questions to herd them toward the truth."}
          </p>
          <button className="btn-primary h-28 text-lg title" onClick={draw} disabled={amLate}>
            {amLate ? "Wait for the group…" : "🎲 DRAW A REASON"}
          </button>
        </>
      )}

      {state.phase === "playing" && (
        <>
          {amLate ? (
            <div className="card-glow border-white/30">
              <div className="text-[11px] uppercase tracking-[0.3em] text-flame font-bold">your job</div>
              <p className="text-lg font-bold mt-2 leading-snug">
                "Sorry I'm late…" Now improvise what happened. Use the group's leading questions as hints. Guess what the reason was.
              </p>
            </div>
          ) : (
            <div className="card-glow border-flame/40">
              <div className="text-[11px] uppercase tracking-[0.3em] text-flame font-bold">why {late?.name} is late · hidden from them</div>
              <p className="text-xl font-bold mt-3 leading-snug">They're late because {state.reason}.</p>
              <p className="text-white/60 text-sm mt-3">
                Ask leading questions that nudge them toward this reason without giving it away.
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-ghost" onClick={() => gameAction("reveal")}>🔓 Reveal</button>
            <button className="btn-primary" onClick={() => gameAction("next")}>Next late one →</button>
          </div>
        </>
      )}

      {state.phase === "reveal" && (
        <>
          <div className="card-glow pop-in">
            <div className="text-[11px] uppercase tracking-[0.3em] text-flame font-bold">real reason</div>
            <p className="text-xl font-bold mt-3 leading-snug">{late?.name} was late because {state.reason}.</p>
          </div>
          <button className="btn-primary" onClick={() => gameAction("next")}>Next late one →</button>
        </>
      )}
    </div>
  );
}
