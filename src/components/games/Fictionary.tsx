"use client";
import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { words, type FictionaryWord } from "@/lib/content/fictionary";
import { pickUnseen } from "@/lib/pick";
import { TurnBanner } from "@/components/TurnBanner";

type Phase = "idle" | "submit" | "vote" | "reveal";

type State = {
  turnIndex: number;
  word: FictionaryWord | null;
  submissions: Record<string, string>;
  phase: Phase;
  order: Array<{ text: string; authorPid: string | "real" }> | null;
  votes: Record<string, number>;
};

export function Fictionary() {
  const { room, pid, gameAction } = useStore();
  const [draft, setDraft] = useState("");
  const state = (room?.gameState || {}) as State;

  // Reset local draft whenever a new word appears.
  useEffect(() => {
    setDraft("");
  }, [state.word, state.turnIndex]);

  if (!room) return null;
  const reader = room.players[state.turnIndex % room.players.length];
  const amReader = pid === reader?.id;
  const mySubmission = pid ? state.submissions?.[pid] : undefined;
  const myVote = pid != null ? state.votes?.[pid] : undefined;
  const voters = Object.keys(state.votes || {});
  const submittersNeeded = room.players.length - 1;

  const draw = () => {
    if (!amReader) return;
    const pool = words[room.intensity];
    const poolKey = `fictionary:${room.intensity}`;
    const { item, index, poolSize } = pickUnseen(pool, room.bags?.[poolKey]);
    gameAction("draw", { word: item, poolKey, index, poolSize });
  };

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    gameAction("submit", { definition: text });
  };

  return (
    <div className="flex flex-col gap-5 pop-in">
      <TurnBanner playerId={reader?.id} label="You're the reader" />

      {(!state.word || state.phase === "idle") && (
        <button
          className="btn-primary h-36 text-xl title"
          onClick={draw}
          disabled={!amReader}
        >
          {amReader ? "📖 DRAW A WORD" : `Waiting for ${reader?.name}…`}
        </button>
      )}

      {state.word && state.phase === "submit" && (
        <>
          <div className="card-glow">
            <div className="text-[11px] uppercase tracking-[0.3em] text-flame font-bold">today's word</div>
            <p className="title text-3xl font-black mt-2 holo-text">{state.word.word}</p>
            <p className="text-white/50 text-sm mt-2">Read it aloud to the group. Everyone else bluffs a fake definition.</p>
          </div>

          {!amReader ? (
            <div className="card flex flex-col gap-3">
              {mySubmission ? (
                <>
                  <div className="text-[10px] uppercase tracking-widest text-emerald-300">Locked in ✓</div>
                  <p className="text-sm text-white/80">"{mySubmission}"</p>
                </>
              ) : (
                <>
                  <label className="text-sm text-white/70">Write a fake definition convincing enough to fool the group.</label>
                  <textarea
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-3 outline-none focus:ring-2 ring-flame/50 focus:border-flame/40 resize-none"
                    rows={3}
                    placeholder="e.g. A 17th-century Dutch cake made with honey and beetles…"
                    maxLength={200}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                  />
                  <button className="btn-primary" onClick={submit} disabled={!draft.trim()}>
                    Lock in
                  </button>
                </>
              )}
            </div>
          ) : (
            <p className="text-white/50 text-sm text-center">
              Waiting for the group to submit. {Object.keys(state.submissions || {}).length}/{submittersNeeded} locked in.
            </p>
          )}

          <button
            className="btn-ghost"
            onClick={() => gameAction("reveal")}
            disabled={Object.keys(state.submissions || {}).length < submittersNeeded}
          >
            Reveal all ({Object.keys(state.submissions || {}).length}/{submittersNeeded})
          </button>
        </>
      )}

      {state.order && (state.phase === "vote" || state.phase === "reveal") && (
        <>
          <div className="card-glow">
            <div className="text-[11px] uppercase tracking-[0.3em] text-flame font-bold">which is real?</div>
            <p className="title text-2xl font-black mt-1 holo-text">{state.word?.word}</p>
          </div>
          <div className="flex flex-col gap-2">
            {state.order.map((entry, i) => {
              const voteCount = Object.values(state.votes || {}).filter((v) => v === i).length;
              const isReal = entry.authorPid === "real";
              const iAmAuthor = entry.authorPid === pid;
              const cantVote = state.phase === "vote" && (iAmAuthor || amReader);
              return (
                <button
                  key={i}
                  disabled={state.phase === "reveal" || cantVote}
                  onClick={() => gameAction("vote", { index: i })}
                  className={`card text-left transition-all ${
                    myVote === i ? "border-flame shadow-lg shadow-flame/30" : ""
                  } ${state.phase === "reveal" && isReal ? "border-emerald-400 !bg-emerald-400/10" : ""}`}
                >
                  <div className="text-[10px] uppercase tracking-[0.3em] text-white/50">#{i + 1}</div>
                  <p className="font-bold mt-1">{entry.text}</p>
                  {state.phase === "reveal" && (
                    <div className="text-xs mt-2 font-bold">
                      {isReal ? "✓ REAL" : "— fake"} · {voteCount} vote{voteCount === 1 ? "" : "s"}
                      {!isReal && entry.authorPid !== "real" && (
                        <span className="text-white/50 font-normal"> · by {room.players.find((p) => p.id === entry.authorPid)?.name || "?"}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          {state.phase === "vote" && (
            <button
              className="btn-ghost"
              onClick={() => gameAction("tally")}
            >
              Show answers ({voters.length}/{room.players.length - 1})
            </button>
          )}
          {state.phase === "reveal" && (
            <button className="btn-primary" onClick={() => gameAction("next")}>
              Next reader →
            </button>
          )}
        </>
      )}
    </div>
  );
}
