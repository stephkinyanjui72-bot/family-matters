"use client";
import { useStore } from "@/lib/store";
import { prompts } from "@/lib/content/hot-seat";
import { pickUnseen } from "@/lib/pick";
import { TurnBanner } from "@/components/TurnBanner";

export function HotSeat() {
  const { room, gameAction } = useStore();
  if (!room) return null;
  const state = (room.gameState || {}) as { victimIndex: number; prompt: string | null };
  const victim = room.players[state.victimIndex % room.players.length];
  const draw = () => {
    const pool = prompts[room.intensity];
    const poolKey = `hs:${room.intensity}`;
    const { item, index, poolSize } = pickUnseen(pool, room.bags?.[poolKey]);
    gameAction("reveal", { prompt: item, poolKey, index, poolSize });
  };

  return (
    <div className="flex flex-col gap-5 pop-in">
      <TurnBanner playerId={victim?.id} label="🔥 You're on the hot seat 🔥" />
      <div className="card-glow text-center relative overflow-hidden">
        <div className="absolute -inset-6 bg-gradient-to-br from-flame/40 via-rose-700/30 to-orange-600/30 blur-2xl pointer-events-none" />
        <div className="relative">
          <div className="text-[10px] uppercase tracking-[0.3em] text-white/60">🔥 on the hot seat 🔥</div>
          <div className="title text-4xl font-black mt-1 holo-text">{victim?.name}</div>
          <div className="text-xs text-white/60 mt-2 uppercase tracking-widest">answer fast · or drink</div>
        </div>
      </div>

      {!state.prompt && (
        <button className="btn-primary h-32 text-xl title" onClick={draw}>
          🎲 FIRE QUESTION
        </button>
      )}

      {state.prompt && (
        <div className="card pop-in">
          <p className="text-2xl font-bold leading-snug">{state.prompt}</p>
          <div className="grid grid-cols-2 gap-2 mt-6">
            <button className="btn-ghost" onClick={draw}>🎲 Another Q</button>
            <button className="btn-primary" onClick={() => gameAction("nextVictim")}>New victim →</button>
          </div>
        </div>
      )}
    </div>
  );
}
