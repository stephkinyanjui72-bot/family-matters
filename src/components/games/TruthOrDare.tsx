"use client";
import { useStore } from "@/lib/store";
import { truths, dares } from "@/lib/content/truth-or-dare";
import { pickUnseen } from "@/lib/pick";
import { TurnBanner } from "@/components/TurnBanner";

export function TruthOrDare() {
  const { room, isHost, pid, gameAction } = useStore();
  if (!room) return null;
  const state = (room.gameState || {}) as { turnIndex: number; pick: "truth" | "dare" | null; prompt: string | null };
  const current = room.players[state.turnIndex % room.players.length];
  const amCurrent = pid === current?.id;

  const drawFrom = (kind: "truth" | "dare") => {
    const pool = kind === "truth" ? truths[room.intensity] : dares[room.intensity];
    const poolKey = `tod:${kind}:${room.intensity}`;
    const { item, index, poolSize } = pickUnseen(pool, room.bags?.[poolKey]);
    gameAction("pick", { kind, prompt: item, poolKey, index, poolSize });
  };
  const choose = (kind: "truth" | "dare") => drawFrom(kind);
  const reroll = () => {
    if (!state.pick) return;
    drawFrom(state.pick);
  };

  return (
    <div className="flex flex-col gap-5 pop-in">
      <TurnBanner playerId={current?.id} label="Pick truth or dare" />
      <div className="card text-center relative overflow-hidden">
        <div className="absolute -inset-6 bg-gradient-to-br from-flame/20 via-transparent to-neon/20 blur-2xl pointer-events-none" />
        <div className="relative">
          <div className="text-[10px] uppercase tracking-[0.3em] text-white/50">It's</div>
          <div className="title text-4xl font-black mt-1 holo-text">{current?.name}</div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-white/50 mt-1">
            {amCurrent ? "pick your fate" : "their turn"}
          </div>
        </div>
      </div>

      {!state.pick && (
        <div className="grid grid-cols-2 gap-3">
          <button
            className="btn bg-gradient-to-br from-sky-500 via-indigo-600 to-purple-700 text-white text-2xl title h-40 shadow-xl shadow-sky-500/40 active:scale-[0.97]"
            onClick={() => choose("truth")}
          >
            💭 TRUTH
          </button>
          <button
            className="btn bg-gradient-to-br from-flame via-ember to-rose-600 text-white text-2xl title h-40 shadow-xl shadow-flame/50 active:scale-[0.97]"
            onClick={() => choose("dare")}
          >
            🔥 DARE
          </button>
        </div>
      )}

      {state.pick && state.prompt && (
        <div className={`card-glow pop-in ${state.pick === "dare" ? "border-flame/50" : "border-sky-400/50"}`}>
          <div className={`uppercase tracking-[0.3em] text-[11px] font-bold ${state.pick === "dare" ? "text-flame" : "text-sky-300"}`}>
            {state.pick === "dare" ? "🔥 dare" : "💭 truth"}
          </div>
          <p className="text-2xl font-bold mt-3 leading-snug">{state.prompt}</p>
          <div className="grid grid-cols-2 gap-2 mt-6">
            <button className="btn-ghost" onClick={reroll}>🎲 Re-roll</button>
            <button className="btn-primary" onClick={() => gameAction("next")}>Next →</button>
          </div>
          {!isHost && <p className="text-[10px] uppercase tracking-widest text-white/40 mt-2 text-center">host advances · you can re-roll</p>}
        </div>
      )}
    </div>
  );
}
