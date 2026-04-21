"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { TurnBanner } from "@/components/TurnBanner";

type State = {
  psychicIndex: number;
  word: string | null;
  phase: "idle" | "thinking" | "reveal";
};

export function Psychic() {
  const { room, pid, gameAction } = useStore();
  const [draft, setDraft] = useState("");
  const state = (room?.gameState || {}) as State;

  if (!room) return null;
  const psychic = room.players[state.psychicIndex % room.players.length];
  const amPsychic = pid === psychic?.id;

  return (
    <div className="flex flex-col gap-5 pop-in">
      <TurnBanner playerId={psychic?.id} label="🔮 You're the psychic" />
      <div className="card text-center">
        <div className="text-[10px] uppercase tracking-[0.3em] text-white/50">Tonight's psychic</div>
        <div className="title text-3xl font-black holo-text">{psychic?.name}</div>
      </div>

      {state.phase === "idle" && (
        <>
          <p className="text-center text-white/70 text-sm">
            {amPsychic
              ? "Close your eyes. The group will pick a word. Then you have to guess it using pure vibes."
              : "Agree on a word everyone will think of — but don't say it. Someone types it into this phone without showing the psychic."}
          </p>
          {!amPsychic && (
            <div className="card flex flex-col gap-3">
              <label className="text-sm text-white/70">Secret word</label>
              <input
                type="password"
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-flame/50 focus:border-flame/40 text-lg"
                placeholder="shh…"
                maxLength={40}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <button
                className="btn-primary"
                onClick={() => { gameAction("submit", { word: draft.trim() }); setDraft(""); }}
                disabled={!draft.trim()}
              >
                Lock in
              </button>
            </div>
          )}
        </>
      )}

      {state.phase === "thinking" && (
        <>
          {amPsychic ? (
            <div className="card-glow border-flame/40">
              <div className="text-[11px] uppercase tracking-[0.3em] text-flame font-bold">channel the group</div>
              <p className="text-lg font-bold mt-2 leading-snug">
                Everyone is picturing the word. Guess it aloud. Use the vibes. When you're ready, reveal.
              </p>
            </div>
          ) : (
            <div className="card-glow">
              <div className="text-[11px] uppercase tracking-[0.3em] text-flame font-bold">secret word · hidden from {psychic?.name}</div>
              <p className="title text-3xl font-black mt-3 holo-text">{state.word}</p>
              <p className="text-white/60 text-sm mt-3">
                Picture it. Hold it in your mind. Don't say it.
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-ghost" onClick={() => gameAction("reveal")}>🔓 Reveal</button>
            <button className="btn-primary" onClick={() => gameAction("next")}>Next psychic →</button>
          </div>
        </>
      )}

      {state.phase === "reveal" && (
        <>
          <div className="card-glow pop-in">
            <div className="text-[11px] uppercase tracking-[0.3em] text-flame font-bold">the word was</div>
            <p className="title text-3xl font-black mt-2 holo-text">{state.word}</p>
          </div>
          <button className="btn-primary" onClick={() => gameAction("next")}>Next psychic →</button>
        </>
      )}
    </div>
  );
}
