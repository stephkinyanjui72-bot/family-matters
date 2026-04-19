"use client";
import { useStore } from "@/lib/store";
import { challenges } from "@/lib/content/do-or-drink";
import { pickUnseen } from "@/lib/pick";
import { TurnBanner } from "@/components/TurnBanner";

export function DoOrDrink() {
  const { room, gameAction } = useStore();
  if (!room) return null;
  const state = (room.gameState || {}) as { turnIndex: number; challenge: string | null };
  const current = room.players[state.turnIndex % room.players.length];
  const reveal = () => {
    const pool = challenges[room.intensity];
    const poolKey = `dod:${room.intensity}`;
    const { item, index, poolSize } = pickUnseen(pool, room.bags?.[poolKey]);
    gameAction("reveal", { challenge: item, poolKey, index, poolSize });
  };

  return (
    <div className="flex flex-col gap-5 pop-in">
      <TurnBanner playerId={current?.id} label="Challenge is yours" />
      <div className="card text-center">
        <div className="text-[10px] uppercase tracking-[0.3em] text-white/50">Challenge for</div>
        <div className="title text-4xl font-black mt-1 holo-text">{current?.name}</div>
      </div>

      {!state.challenge && (
        <button className="btn-primary h-40 text-2xl title" onClick={reveal}>
          🎲 REVEAL CHALLENGE
        </button>
      )}

      {state.challenge && (
        <div className="card-glow pop-in">
          <div className="text-[11px] uppercase tracking-[0.3em] text-flame font-bold">challenge</div>
          <p className="text-2xl font-bold mt-3 leading-snug">{state.challenge}</p>
          <div className="grid grid-cols-3 gap-2 mt-6">
            <button className="btn-ghost" onClick={reveal}>🎲 New</button>
            <button className="btn-ghost" onClick={() => gameAction("next")}>🥃 Drank</button>
            <button className="btn-primary" onClick={() => gameAction("next")}>✅ Did it</button>
          </div>
        </div>
      )}
    </div>
  );
}
