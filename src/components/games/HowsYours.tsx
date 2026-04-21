"use client";
import { useStore } from "@/lib/store";
import { topics } from "@/lib/content/hows-yours";
import { pickUnseen } from "@/lib/pick";
import { TurnBanner } from "@/components/TurnBanner";

type State = {
  guesserIndex: number;
  topic: string | null;
  phase: "idle" | "playing" | "reveal";
};

export function HowsYours() {
  const { room, pid, gameAction } = useStore();
  const state = (room?.gameState || {}) as State;

  if (!room) return null;
  const guesser = room.players[state.guesserIndex % room.players.length];
  const amGuesser = pid === guesser?.id;

  const draw = () => {
    const pool = topics[room.intensity];
    const poolKey = `hows-yours:${room.intensity}`;
    const { item, index, poolSize } = pickUnseen(pool, room.bags?.[poolKey]);
    gameAction("draw", { topic: item, poolKey, index, poolSize });
  };

  return (
    <div className="flex flex-col gap-5 pop-in">
      <TurnBanner playerId={guesser?.id} label="👀 You're the guesser" />
      <div className="card text-center">
        <div className="text-[10px] uppercase tracking-[0.3em] text-white/50">Asking "how's yours?"</div>
        <div className="title text-3xl font-black holo-text">{guesser?.name}</div>
      </div>

      {state.phase === "idle" && (
        <>
          <p className="text-center text-white/70 text-sm">
            {amGuesser
              ? "Everyone else will share a secret about something they all have. Ask 'How's yours?' to each player and guess what the topic is."
              : "Pick a shared topic. Each of you describes YOURS honestly when the guesser asks. They try to figure out the topic."}
          </p>
          <button className="btn-primary h-28 text-lg title" onClick={draw} disabled={amGuesser}>
            {amGuesser ? "Wait for the group…" : "🎲 DRAW A TOPIC"}
          </button>
        </>
      )}

      {state.phase === "playing" && (
        <>
          {amGuesser ? (
            <div className="card-glow border-white/30">
              <div className="text-[11px] uppercase tracking-[0.3em] text-flame font-bold">ask each player: "how's yours?"</div>
              <p className="text-sm text-white/70 mt-2">
                They each describe their own version of a secret topic. Figure out what everyone is describing.
              </p>
            </div>
          ) : (
            <div className="card-glow border-flame/40">
              <div className="text-[11px] uppercase tracking-[0.3em] text-flame font-bold">topic · hidden from {guesser?.name}</div>
              <p className="text-xl font-bold mt-3 leading-snug capitalize">{state.topic}</p>
              <p className="text-white/60 text-sm mt-3">
                When asked, describe YOUR {state.topic} honestly. Don't give it away directly.
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-ghost" onClick={() => gameAction("reveal")}>🔓 Reveal</button>
            <button className="btn-primary" onClick={() => gameAction("next")}>Next guesser →</button>
          </div>
        </>
      )}

      {state.phase === "reveal" && (
        <>
          <div className="card-glow pop-in">
            <div className="text-[11px] uppercase tracking-[0.3em] text-flame font-bold">topic was</div>
            <p className="text-xl font-bold mt-3 leading-snug capitalize">{state.topic}</p>
          </div>
          <button className="btn-primary" onClick={() => gameAction("next")}>Next guesser →</button>
        </>
      )}
    </div>
  );
}
