"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { prompts } from "@/lib/content/paranoia";
import { pick, pickUnseen } from "@/lib/pick";
import { TurnBanner } from "@/components/TurnBanner";

export function Paranoia() {
  const { room, pid, gameAction } = useStore();
  const [shown, setShown] = useState(false);
  if (!room) return null;
  const state = (room.gameState || {}) as { askerIndex: number; prompt: string | null; targetId: string | null; revealed: boolean };
  const asker = room.players[state.askerIndex % room.players.length];
  const target = state.targetId ? room.players.find((p) => p.id === state.targetId) : null;
  const amAsker = pid === asker?.id;
  const amTarget = pid === state.targetId;

  const start = () => {
    if (!amAsker) return;
    const others = room.players.filter((p) => p.id !== asker.id);
    if (others.length === 0) return;
    const t = pick(others);
    const pool = prompts[room.intensity];
    const poolKey = `paranoia:${room.intensity}`;
    const { item, index, poolSize } = pickUnseen(pool, room.bags?.[poolKey]);
    gameAction("ask", { prompt: item, targetId: t.id, poolKey, index, poolSize });
    setShown(false);
  };

  return (
    <div className="flex flex-col gap-5 pop-in">
      <TurnBanner playerId={asker?.id} label={state.prompt ? "You're the asker" : "Your turn to ask"} />
      <p className="text-center text-white/60 text-sm leading-relaxed">
        Asker whispers the question to the target. Target says a <b className="text-flame">name</b> out loud.
        Only the name — not the question. Flip the coin to reveal it to everyone.
      </p>

      {!state.prompt && (
        <button className="btn-primary h-36 text-xl title" onClick={start}>
          {amAsker ? `🎲 ${asker.name}, draw` : `Waiting for ${asker?.name}…`}
        </button>
      )}

      {state.prompt && !state.revealed && (
        <div className="card-glow">
          <div className="text-[10px] uppercase tracking-[0.3em] text-white/50">Whispered to</div>
          <div className="title text-3xl font-black holo-text mb-3">{target?.name}</div>
          {amAsker || amTarget ? (
            <>
              <button className="btn-ghost w-full" onClick={() => setShown((s) => !s)}>
                {shown ? "🙈 Hide question" : "👁 Show me the question"}
              </button>
              {shown && <p className="text-xl font-bold mt-3">{state.prompt}</p>}
            </>
          ) : (
            <p className="text-white/60 text-sm italic">Only the asker and target can see this.</p>
          )}
          <div className="grid grid-cols-2 gap-2 mt-6">
            <button className="btn-ghost" onClick={() => gameAction("next")}>
              🪙 Hide → Next
            </button>
            <button className="btn-primary" onClick={() => gameAction("flipCoin", { revealed: true })}>
              🪙 Reveal!
            </button>
          </div>
        </div>
      )}
      {state.revealed && (
        <div className="card-glow pop-in">
          <div className="text-[11px] uppercase tracking-[0.3em] text-flame font-bold">revealed question</div>
          <p className="text-2xl font-bold mt-3">{state.prompt}</p>
          <div className="text-white/60 mt-3 text-sm">Directed at <b className="text-white">{target?.name}</b>.</div>
          <button className="btn-primary w-full mt-6" onClick={() => gameAction("next")}>
            Next asker →
          </button>
        </div>
      )}
    </div>
  );
}
