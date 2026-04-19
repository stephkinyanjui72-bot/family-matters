"use client";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { categories } from "@/lib/content/kmA";
import { pickUnseen } from "@/lib/pick";
import { TurnBanner } from "@/components/TurnBanner";

type Choice = "kiss" | "marry" | "avoid";

export function KissMarryAvoid() {
  const { room, isHost, pid, gameAction } = useStore();
  const [mapping, setMapping] = useState<Record<number, Choice>>({});

  const state = (room?.gameState || {}) as {
    turnIndex: number;
    options: readonly string[] | null;
    choices: Record<string, Record<number, Choice>>;
  };

  useEffect(() => {
    setMapping({});
  }, [state.options, state.turnIndex]);

  if (!room) return null;
  const current = room.players[state.turnIndex % room.players.length];
  const amCurrent = pid === current?.id;

  const tier = (categories as Record<string, readonly (readonly string[])[]>)[room.intensity] || categories.mild;
  const myChoice = pid ? state.choices?.[pid] : undefined;
  const submitted = !!myChoice;

  const assign = (i: number, c: Choice) => {
    if (submitted) return;
    const next = { ...mapping };
    // if c is already used elsewhere, swap
    for (const k of Object.keys(next)) {
      if (next[Number(k)] === c) delete next[Number(k)];
    }
    next[i] = c;
    setMapping(next);
  };

  const submit = () => {
    if (Object.values(mapping).length !== 3) return;
    gameAction("choose", { mapping });
  };

  const allSubmitted = Object.keys(state.choices || {}).length;

  return (
    <div className="flex flex-col gap-5 pop-in">
      <TurnBanner playerId={current?.id} label={state.options ? "Your round" : "Draw 3 options"} />
      <div className="card text-center">
        <div className="text-[10px] uppercase tracking-[0.3em] text-white/50">Round for</div>
        <div className="title text-3xl font-black holo-text">{current?.name}</div>
      </div>

      {!state.options && amCurrent && (
        <button
          className="btn-primary h-32 text-xl title"
          onClick={() => {
            const poolKey = `kma:${room.intensity}`;
            const { item, index, poolSize } = pickUnseen(tier, room.bags?.[poolKey]);
            gameAction("reveal", { options: item, poolKey, index, poolSize });
          }}
        >
          🎲 DRAW 3 OPTIONS
        </button>
      )}
      {!state.options && !amCurrent && (
        <p className="text-center text-white/50 text-sm">Waiting for <b className="text-white">{current?.name}</b>…</p>
      )}

      {state.options && (
        <div className="flex flex-col gap-3">
          {state.options.map((opt, i) => {
            const chosen = mapping[i];
            const locked = myChoice?.[i];
            const display = locked || chosen;
            return (
              <div key={i} className={`card transition ${display ? "border-flame/40" : ""}`}>
                <div className="font-bold text-lg">{opt}</div>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {(["kiss", "marry", "avoid"] as const).map((c) => {
                    const active = display === c;
                    const colors: Record<Choice, string> = {
                      kiss: "from-flame to-rose-500 shadow-flame/50",
                      marry: "from-emerald-400 to-teal-500 shadow-emerald-500/50",
                      avoid: "from-slate-500 to-slate-700 shadow-slate-500/30",
                    };
                    return (
                      <button
                        key={c}
                        disabled={submitted}
                        onClick={() => assign(i, c)}
                        className={`rounded-xl py-2 text-sm font-bold border transition-all ${
                          active
                            ? `bg-gradient-to-br ${colors[c]} text-white border-white/30 shadow-lg`
                            : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                        }`}
                      >
                        {c === "kiss" ? "💋 Kiss" : c === "marry" ? "💍 Marry" : "🚫 Avoid"}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {!submitted && (
            <button className="btn-primary" disabled={Object.values(mapping).length !== 3} onClick={submit}>
              Lock in my choices ({Object.values(mapping).length}/3)
            </button>
          )}
          {submitted && <p className="text-center text-white/50 text-sm">Locked in ✨</p>}
          {isHost && (
            <button className="btn-ghost" onClick={() => gameAction("next")}>
              Next turn → {allSubmitted > 0 && `(${allSubmitted} locked)`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
