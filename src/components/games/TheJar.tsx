"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";

type Phase = "submit" | "reading" | "done";
type State = {
  phase: Phase;
  submissions: Record<string, string>;
  order: Array<{ authorPid: string; text: string }> | null;
  readIndex: number;
  votes: Record<string, Record<string, string>>;
  revealed: boolean;
};

export function TheJar() {
  const { room, pid, gameAction } = useStore();
  const [draft, setDraft] = useState("");
  const state = (room?.gameState || {}) as State;

  if (!room) return null;
  const mySubmission = pid ? state.submissions?.[pid] : undefined;
  const submittedCount = Object.keys(state.submissions || {}).length;
  const current = state.order?.[state.readIndex];
  const currentVotes = state.votes?.[String(state.readIndex)] || {};
  const myVote = pid ? currentVotes[pid] : undefined;
  const voteCount = Object.keys(currentVotes).length;
  const isMyConfession = current?.authorPid === pid;

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    gameAction("submit", { text });
    setDraft("");
  };

  return (
    <div className="flex flex-col gap-5 pop-in">
      <div className="card text-center">
        <div className="text-4xl">🏺</div>
        <div className="title text-2xl font-black mt-1 holo-text">The Jar</div>
        <p className="text-white/60 text-xs mt-2 uppercase tracking-widest">confess anonymously · guess whose is whose</p>
      </div>

      {state.phase === "submit" && (
        <>
          <div className="card flex flex-col gap-3">
            <label className="text-sm text-white/70">
              Write a confession nobody knows. It'll be read anonymously. The group will guess whose it is.
            </label>
            {mySubmission ? (
              <>
                <div className="text-[10px] uppercase tracking-widest text-emerald-300">Locked in ✓</div>
                <p className="text-sm text-white/80 italic">"{mySubmission}"</p>
              </>
            ) : (
              <>
                <textarea
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-3 outline-none focus:ring-2 ring-flame/50 focus:border-flame/40 resize-none"
                  rows={3}
                  placeholder="I once…"
                  maxLength={220}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <button className="btn-primary" onClick={submit} disabled={!draft.trim()}>
                  Drop in the jar
                </button>
              </>
            )}
          </div>
          <button
            className="btn-ghost"
            onClick={() => gameAction("startReading")}
            disabled={submittedCount < 2}
          >
            📜 Start reading ({submittedCount}/{room.players.length} dropped)
          </button>
        </>
      )}

      {state.phase === "reading" && current && (
        <>
          <div className="card-glow">
            <div className="text-[11px] uppercase tracking-[0.3em] text-flame font-bold">
              confession {state.readIndex + 1}/{state.order?.length}
            </div>
            <p className="title text-xl font-bold mt-2 leading-snug">"{current.text}"</p>
          </div>

          {!state.revealed && (
            <>
              <p className="text-center text-white/60 text-sm">
                {isMyConfession ? "You wrote this — just watch the votes." : "Who do you think wrote this?"}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {room.players.map((p) => (
                  <button
                    key={p.id}
                    disabled={isMyConfession || p.id === pid}
                    onClick={() => gameAction("vote", { playerId: p.id })}
                    className={`rounded-2xl py-3 px-3 border font-bold transition-all ${
                      myVote === p.id
                        ? "bg-gradient-to-br from-flame to-ember border-white/40 text-white shadow-lg shadow-flame/40"
                        : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                    } ${isMyConfession ? "opacity-40" : ""}`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
              <button className="btn-ghost" onClick={() => gameAction("revealOne")}>
                👀 Reveal author ({voteCount}/{room.players.length - 1} voted)
              </button>
            </>
          )}

          {state.revealed && (
            <>
              <div className="card-glow pop-in border-emerald-400/30">
                <div className="text-[10px] uppercase tracking-widest text-emerald-300">confession by</div>
                <div className="title text-2xl font-black mt-1">{room.players.find((pl) => pl.id === current.authorPid)?.name || "?"}</div>
                <div className="mt-3 text-sm text-white/70 flex flex-wrap gap-1">
                  {Object.entries(currentVotes).map(([voter, guess]) => {
                    const correct = guess === current.authorPid;
                    return (
                      <span key={voter} className={`chip border ${correct ? "border-emerald-400/40 text-emerald-300" : "border-rose-500/40 text-rose-300/80"}`}>
                        {room.players.find((p) => p.id === voter)?.name} → {room.players.find((p) => p.id === guess)?.name}
                      </span>
                    );
                  })}
                </div>
              </div>
              <button className="btn-primary" onClick={() => gameAction("nextConfession")}>
                Next confession →
              </button>
            </>
          )}
        </>
      )}

      {state.phase === "done" && (
        <div className="card-glow text-center pop-in">
          <div className="text-5xl mb-2">🎉</div>
          <div className="title text-xl font-black">All confessions unsealed</div>
          <button className="btn-primary w-full mt-4" onClick={() => gameAction("reset")}>
            🔄 Start over
          </button>
        </div>
      )}
    </div>
  );
}
