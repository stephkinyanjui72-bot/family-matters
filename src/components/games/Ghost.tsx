"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { TurnBanner } from "@/components/TurnBanner";

type State = {
  turnIndex: number;
  letters: string;
  score: Record<string, number>;
  out: string[];
};

const GHOST = ["G", "H", "O", "S", "T"];

export function Ghost() {
  const { room, pid, gameAction } = useStore();
  const [letter, setLetter] = useState("");
  const state = (room?.gameState || {}) as State;

  if (!room) return null;
  const alivePlayers = room.players.filter((p) => !(state.out || []).includes(p.id));
  const current = alivePlayers[state.turnIndex % Math.max(1, alivePlayers.length)];
  const amCurrent = pid === current?.id;

  const submit = () => {
    const ch = letter.trim().toUpperCase();
    if (!/^[A-Z]$/.test(ch)) return;
    gameAction("addLetter", { letter: ch });
    setLetter("");
  };

  return (
    <div className="flex flex-col gap-5 pop-in">
      <TurnBanner playerId={current?.id} label="Add a letter" />

      <div className="card-glow text-center">
        <div className="text-[10px] uppercase tracking-[0.3em] text-white/50">current string</div>
        <div className="title text-5xl font-black mt-2 tracking-widest holo-text min-h-[3.5rem]">
          {state.letters || "…"}
        </div>
        <p className="text-white/60 text-xs mt-3">
          Don't complete a valid word (3+ letters). Group decides.
        </p>
      </div>

      {amCurrent ? (
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <input
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-center text-3xl font-black tracking-widest outline-none focus:ring-2 ring-flame/50 focus:border-flame/40 uppercase"
            value={letter}
            maxLength={1}
            onChange={(e) => setLetter(e.target.value.slice(-1).toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="?"
          />
          <button className="btn-primary" onClick={submit} disabled={!/^[A-Z]$/.test(letter.toUpperCase())}>
            Add
          </button>
        </div>
      ) : (
        <p className="text-center text-white/50 text-sm">Waiting for {current?.name}…</p>
      )}

      <div className="card">
        <div className="text-[10px] uppercase tracking-[0.3em] text-white/50 mb-2">Scoreboard</div>
        <div className="flex flex-col gap-1.5">
          {room.players.map((p) => {
            const n = state.score?.[p.id] || 0;
            const isOut = (state.out || []).includes(p.id);
            return (
              <div key={p.id} className="flex items-center justify-between gap-2">
                <span className={`text-sm font-bold ${isOut ? "text-white/30 line-through" : "text-white/90"}`}>{p.name}</span>
                <div className="flex items-center gap-1">
                  {GHOST.map((letter, i) => (
                    <span
                      key={i}
                      className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${
                        i < n ? "bg-gradient-to-br from-flame to-ember text-white" : "bg-white/10 text-white/30"
                      }`}
                    >
                      {letter}
                    </span>
                  ))}
                  {!isOut && (
                    <button
                      className="ml-2 chip border-white/20 text-white/60 hover:border-flame hover:text-flame text-[10px]"
                      onClick={() => gameAction("giveGhost", { playerId: p.id })}
                    >
                      +1
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <button className="btn-ghost w-full mt-3 !py-2 !text-xs" onClick={() => gameAction("resetRound")}>
          🔄 Clear word · next round
        </button>
      </div>
    </div>
  );
}
