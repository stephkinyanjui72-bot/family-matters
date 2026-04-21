"use client";
import { useStore } from "@/lib/store";
import { prompts } from "@/lib/content/thumbs-up-down";
import { pickUnseen } from "@/lib/pick";

type State = {
  prompt: string | null;
  votes: Record<string, "up" | "down">;
  revealed: boolean;
};

export function ThumbsUpDown() {
  const { room, pid, gameAction } = useStore();
  const state = (room?.gameState || {}) as State;

  if (!room) return null;
  const myVote = pid ? state.votes?.[pid] : undefined;
  const upCount = Object.values(state.votes || {}).filter((v) => v === "up").length;
  const downCount = Object.values(state.votes || {}).filter((v) => v === "down").length;
  const total = Object.keys(state.votes || {}).length;

  const draw = () => {
    const pool = prompts[room.intensity];
    const poolKey = `thumbs-up-down:${room.intensity}`;
    const { item, index, poolSize } = pickUnseen(pool, room.bags?.[poolKey]);
    gameAction("draw", { prompt: item, poolKey, index, poolSize });
  };

  return (
    <div className="flex flex-col gap-5 pop-in">
      {!state.prompt && (
        <button className="btn-primary h-36 text-xl title" onClick={draw}>
          👍 DRAW A PROMPT
        </button>
      )}

      {state.prompt && (
        <>
          <div className="card-glow text-center">
            <div className="text-[11px] uppercase tracking-[0.3em] text-flame font-bold">would you, or wouldn't you?</div>
            <p className="title text-2xl font-black mt-2 leading-snug">{state.prompt}</p>
          </div>

          {!state.revealed && (
            <div className="grid grid-cols-2 gap-3">
              <button
                className={`rounded-3xl py-8 border text-5xl font-black transition-all ${
                  myVote === "down"
                    ? "bg-gradient-to-br from-rose-600 to-rose-500 border-white/40 scale-[1.02]"
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                }`}
                onClick={() => gameAction("vote", { choice: "down" })}
              >
                👎
              </button>
              <button
                className={`rounded-3xl py-8 border text-5xl font-black transition-all ${
                  myVote === "up"
                    ? "bg-gradient-to-br from-emerald-500 to-teal-500 border-white/40 scale-[1.02]"
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                }`}
                onClick={() => gameAction("vote", { choice: "up" })}
              >
                👍
              </button>
            </div>
          )}

          {!state.revealed && (
            <button className="btn-ghost" onClick={() => gameAction("reveal")}>
              Reveal ({total}/{room.players.length})
            </button>
          )}

          {state.revealed && (
            <>
              <div className="card pop-in">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <div className="text-4xl">👎</div>
                    <div className="title text-3xl font-black mt-1">{downCount}</div>
                    <div className="text-[10px] text-white/50 uppercase tracking-widest mt-1">wouldn't</div>
                    <div className="flex flex-wrap gap-1 justify-center mt-2">
                      {Object.entries(state.votes || {})
                        .filter(([, v]) => v === "down")
                        .map(([voter]) => (
                          <span key={voter} className="chip border-rose-500/30 text-rose-200 text-[10px]">
                            {room.players.find((p) => p.id === voter)?.name}
                          </span>
                        ))}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl">👍</div>
                    <div className="title text-3xl font-black mt-1">{upCount}</div>
                    <div className="text-[10px] text-white/50 uppercase tracking-widest mt-1">would</div>
                    <div className="flex flex-wrap gap-1 justify-center mt-2">
                      {Object.entries(state.votes || {})
                        .filter(([, v]) => v === "up")
                        .map(([voter]) => (
                          <span key={voter} className="chip border-emerald-400/30 text-emerald-200 text-[10px]">
                            {room.players.find((p) => p.id === voter)?.name}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
              <button className="btn-primary" onClick={() => gameAction("next")}>Next prompt →</button>
            </>
          )}
        </>
      )}
    </div>
  );
}
