"use client";
import { useStore } from "@/lib/store";
import { prompts } from "@/lib/content/never-have-i-ever";
import { pickUnseen } from "@/lib/pick";

export function NeverHaveIEver() {
  const { room, gameAction } = useStore();
  if (!room) return null;
  const state = (room.gameState || {}) as { prompt: string | null };
  const draw = () => {
    const pool = prompts[room.intensity];
    const poolKey = `nhie:${room.intensity}`;
    const { item, index, poolSize } = pickUnseen(pool, room.bags?.[poolKey]);
    gameAction("reveal", { prompt: item, poolKey, index, poolSize });
  };

  return (
    <div className="flex flex-col gap-5 pop-in">
      <p className="text-center text-white/70 text-sm leading-relaxed">
        Everyone holds up <b className="text-flame">10 fingers</b>. Drop one every time a statement applies to you.
      </p>

      {!state.prompt && (
        <button className="btn-primary h-40 text-2xl title" onClick={draw}>
          🎲 DRAW PROMPT
        </button>
      )}

      {state.prompt && (
        <div className="card-glow pop-in">
          <div className="text-[11px] uppercase tracking-[0.3em] text-flame font-bold">never have I ever</div>
          <p className="text-2xl font-bold mt-3 leading-snug">{state.prompt}</p>
          <div className="grid grid-cols-2 gap-2 mt-6">
            <button className="btn-ghost" onClick={draw}>🎲 Re-roll</button>
            <button className="btn-primary" onClick={() => gameAction("next")}>Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}
