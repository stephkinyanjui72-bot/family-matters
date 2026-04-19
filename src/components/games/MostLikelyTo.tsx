"use client";
import { useStore } from "@/lib/store";
import { prompts } from "@/lib/content/most-likely-to";
import { pickUnseen } from "@/lib/pick";

export function MostLikelyTo() {
  const { room, pid, gameAction } = useStore();
  if (!room) return null;
  const state = (room.gameState || {}) as { prompt: string | null; votes: Record<string, string>; revealed: boolean };
  const myVote = pid ? state.votes?.[pid] : undefined;
  const draw = () => {
    const pool = prompts[room.intensity];
    const poolKey = `mlt:${room.intensity}`;
    const { item, index, poolSize } = pickUnseen(pool, room.bags?.[poolKey]);
    gameAction("reveal", { prompt: item, poolKey, index, poolSize });
  };

  const counts: Record<string, number> = {};
  Object.values(state.votes || {}).forEach((id) => { counts[id] = (counts[id] || 0) + 1; });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const winner = sorted[0];
  const voteCount = Object.keys(state.votes || {}).length;

  return (
    <div className="flex flex-col gap-5 pop-in">
      {!state.prompt && (
        <button className="btn-primary h-40 text-2xl title" onClick={draw}>
          🎲 DRAW PROMPT
        </button>
      )}

      {state.prompt && (
        <>
          <div className="card-glow">
            <div className="text-[11px] uppercase tracking-[0.3em] text-flame font-bold">most likely to</div>
            <p className="text-2xl font-bold mt-3 leading-snug">{state.prompt}</p>
          </div>
          {!state.revealed && (
            <div className="grid grid-cols-2 gap-2">
              {room.players.map((p) => (
                <button
                  key={p.id}
                  onClick={() => gameAction("vote", { playerId: p.id })}
                  className={`rounded-2xl py-3 px-3 border font-bold transition-all ${
                    myVote === p.id
                      ? "bg-gradient-to-br from-flame to-ember border-white/40 text-white shadow-lg shadow-flame/40"
                      : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
          {!state.revealed && (
            <button className="btn-ghost" onClick={() => gameAction("tally")}>
              Reveal votes ({voteCount}/{room.players.length})
            </button>
          )}
          {state.revealed && (
            <div className="card-glow pop-in text-center">
              <div className="text-[11px] uppercase tracking-[0.3em] text-flame font-bold">Winner</div>
              <div className="title text-4xl font-black mt-1 holo-text">
                {winner ? room.players.find((p) => p.id === winner[0])?.name : "No votes"}
              </div>
              {winner && <div className="text-white/60 mt-1">{winner[1]} vote{winner[1] === 1 ? "" : "s"}</div>}
              <div className="grid grid-cols-2 gap-2 mt-5">
                <button className="btn-ghost" onClick={draw}>🎲 Re-roll</button>
                <button className="btn-primary" onClick={() => gameAction("next")}>Next →</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
