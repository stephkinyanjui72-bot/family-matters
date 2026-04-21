"use client";
import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { categories } from "@/lib/content/alphabet-game";
import { pickUnseen } from "@/lib/pick";
import { TurnBanner } from "@/components/TurnBanner";

type Entry = { authorPid: string; item: string; letter: string };
type State = {
  turnIndex: number;
  category: string | null;
  letterIndex: number;
  history: Entry[];
};

export function AlphabetGame() {
  const { room, pid, gameAction } = useStore();
  const [draft, setDraft] = useState("");
  const state = (room?.gameState || {}) as State;

  useEffect(() => {
    setDraft("");
  }, [state.letterIndex, state.turnIndex]);

  if (!room) return null;
  const current = room.players[state.turnIndex % room.players.length];
  const amCurrent = pid === current?.id;
  const letter = String.fromCharCode(65 + (state.letterIndex % 26));

  const pickCategory = () => {
    const pool = categories[room.intensity];
    const poolKey = `alphabet-game:${room.intensity}`;
    const { item, index, poolSize } = pickUnseen(pool, room.bags?.[poolKey]);
    gameAction("setCategory", { category: item, poolKey, index, poolSize });
  };

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    if (text.charAt(0).toUpperCase() !== letter) return;
    gameAction("submit", { item: text });
  };

  return (
    <div className="flex flex-col gap-5 pop-in">
      {!state.category ? (
        <>
          <p className="text-center text-white/70 text-sm">
            Pick a category. Players take turns naming things in that category going through the alphabet.
          </p>
          <button className="btn-primary h-28 text-lg title" onClick={pickCategory}>
            🎲 DRAW A CATEGORY
          </button>
        </>
      ) : (
        <>
          <TurnBanner playerId={current?.id} label={`Your letter: ${letter}`} />

          <div className="card-glow text-center">
            <div className="text-[10px] uppercase tracking-[0.3em] text-white/50">Category</div>
            <p className="title text-2xl font-bold mt-1 holo-text capitalize">{state.category}</p>
            <div className="title text-6xl font-black mt-4 holo-text">{letter}</div>
          </div>

          {amCurrent ? (
            <div className="card flex flex-col gap-3">
              <input
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-flame/50 focus:border-flame/40 text-lg"
                placeholder={`Something starting with ${letter}…`}
                maxLength={60}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
              <div className="grid grid-cols-2 gap-2">
                <button className="btn-ghost" onClick={() => gameAction("pass")}>
                  🍺 Can't · drink
                </button>
                <button
                  className="btn-primary"
                  onClick={submit}
                  disabled={!draft.trim() || draft.trim().charAt(0).toUpperCase() !== letter}
                >
                  Lock in
                </button>
              </div>
              {draft.trim() && draft.trim().charAt(0).toUpperCase() !== letter && (
                <p className="text-xs text-rose-300">Must start with <b>{letter}</b>.</p>
              )}
            </div>
          ) : (
            <p className="text-center text-white/50 text-sm">Waiting for {current?.name}…</p>
          )}

          {state.history.length > 0 && (
            <div className="card">
              <div className="text-[10px] uppercase tracking-[0.3em] text-white/50 mb-2">history ({state.history.length})</div>
              <div className="flex flex-col gap-1 text-xs">
                {state.history.slice(-10).reverse().map((e, i) => (
                  <div key={i} className="flex gap-2 text-white/75">
                    <span className="text-flame font-black w-4">{e.letter}</span>
                    <span>{e.item}</span>
                    <span className="text-white/40 ml-auto">{room.players.find((p) => p.id === e.authorPid)?.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button className="btn-ghost" onClick={() => gameAction("clearCategory")}>
            🔄 New category
          </button>
        </>
      )}
    </div>
  );
}
