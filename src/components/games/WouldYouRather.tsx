"use client";
import { useStore } from "@/lib/store";
import { prompts, WYR } from "@/lib/content/would-you-rather";
import { pickUnseen } from "@/lib/pick";

export function WouldYouRather() {
  const { room, pid, gameAction } = useStore();
  if (!room) return null;
  const state = (room.gameState || {}) as { prompt: WYR | null; votes: Record<string, "a" | "b">; revealed: boolean };
  const myVote = pid ? state.votes?.[pid] : undefined;
  const draw = () => {
    const pool = prompts[room.intensity];
    const poolKey = `wyr:${room.intensity}`;
    const { item, index, poolSize } = pickUnseen(pool, room.bags?.[poolKey]);
    gameAction("reveal", { prompt: item, poolKey, index, poolSize });
  };

  const counts = { a: 0, b: 0 };
  Object.values(state.votes || {}).forEach((v) => { counts[v]++; });
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
          <div className="text-center text-white/50 text-sm uppercase tracking-[0.3em] mb-1">Would you rather…</div>
          <div className="grid grid-cols-1 gap-3">
            {(["a", "b"] as const).map((k) => {
              const pct = voteCount ? Math.round((counts[k] / voteCount) * 100) : 0;
              const isChosen = myVote === k;
              return (
                <button
                  key={k}
                  onClick={() => !state.revealed && gameAction("vote", { choice: k })}
                  className={`card text-left transition-all relative overflow-hidden ${
                    isChosen ? "border-flame shadow-lg shadow-flame/40" : "hover:border-white/30"
                  }`}
                >
                  {state.revealed && (
                    <div
                      className={`absolute inset-y-0 left-0 ${k === "a" ? "bg-sky-500/20" : "bg-flame/20"} pointer-events-none`}
                      style={{ width: `${pct}%`, transition: "width 600ms ease-out" }}
                    />
                  )}
                  <div className="relative">
                    <div className={`text-[10px] uppercase tracking-[0.3em] font-bold ${k === "a" ? "text-sky-300" : "text-flame"}`}>
                      {k === "a" ? "Option A" : "Option B"}
                    </div>
                    <div className="font-bold text-lg mt-1">{state.prompt![k]}</div>
                    {state.revealed && (
                      <div className="mt-2 text-sm text-white/70 font-semibold">{counts[k]} vote{counts[k] === 1 ? "" : "s"} · {pct}%</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          {!state.revealed && (
            <button className="btn-ghost" onClick={() => gameAction("tally")}>
              Reveal ({voteCount}/{room.players.length})
            </button>
          )}
          {state.revealed && (
            <div className="grid grid-cols-2 gap-2">
              <button className="btn-ghost" onClick={draw}>🎲 Re-roll</button>
              <button className="btn-primary" onClick={() => gameAction("next")}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
