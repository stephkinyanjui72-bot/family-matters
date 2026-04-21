"use client";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";

type Round = { a: { pid: string; word: string }; b: { pid: string; word: string } };
type State = {
  pairIndex: number;
  submissions: Record<string, string>;
  history: Round[];
  phase: "submit" | "reveal" | "won";
};

export function SayTheSameThing() {
  const { room, pid, gameAction } = useStore();
  const [draft, setDraft] = useState("");
  const state = (room?.gameState || {}) as State;

  useEffect(() => {
    setDraft("");
  }, [state.history?.length, state.phase, state.pairIndex]);

  if (!room) return null;
  const a = room.players[(state.pairIndex * 2) % room.players.length];
  const b = room.players[(state.pairIndex * 2 + 1) % room.players.length];
  const amA = pid === a?.id;
  const amB = pid === b?.id && a?.id !== b?.id;
  const inPair = amA || amB;
  const mySubmission = pid ? state.submissions?.[pid] : undefined;
  const lastRound = state.history?.[state.history.length - 1];

  const submit = () => {
    const word = draft.trim();
    if (!word) return;
    gameAction("submit", { word });
  };

  return (
    <div className="flex flex-col gap-5 pop-in">
      <div className="card text-center">
        <div className="text-[10px] uppercase tracking-[0.3em] text-white/50">Paired players</div>
        <div className="flex items-center justify-center gap-3 mt-1">
          <span className="title text-2xl font-black holo-text">{a?.name}</span>
          <span className="text-white/40">+</span>
          <span className="title text-2xl font-black holo-text">{b?.name}</span>
        </div>
      </div>

      {lastRound && state.phase === "submit" && (
        <div className="card-glow">
          <div className="text-[10px] uppercase tracking-[0.3em] text-white/50">last round — converge from here</div>
          <div className="flex flex-wrap gap-3 mt-2 items-center">
            <span className="title text-xl font-black">{lastRound.a.word}</span>
            <span className="text-white/40">+</span>
            <span className="title text-xl font-black">{lastRound.b.word}</span>
          </div>
        </div>
      )}

      {!lastRound && state.phase === "submit" && (
        <p className="text-center text-white/60 text-sm">
          Both paired players: say any word at the same time. Next round, each says a word that connects to both previous words. Match = win.
        </p>
      )}

      {state.phase === "submit" && (
        <>
          {inPair ? (
            mySubmission ? (
              <div className="card">
                <div className="text-[10px] uppercase tracking-widest text-emerald-300">Locked in ✓</div>
                <p className="text-lg font-bold mt-1">"{mySubmission}"</p>
                <p className="text-xs text-white/50 mt-2">Waiting for the other player…</p>
              </div>
            ) : (
              <div className="card flex flex-col gap-3">
                <label className="text-sm text-white/70">
                  Say a word {lastRound ? "that connects to both previous words" : "any word"}. Both players submit at the same time.
                </label>
                <input
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-flame/50 focus:border-flame/40 text-lg"
                  placeholder="one word…"
                  maxLength={40}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                />
                <button className="btn-primary" onClick={submit} disabled={!draft.trim()}>
                  Lock in
                </button>
              </div>
            )
          ) : (
            <p className="text-center text-white/50 text-sm">
              Watching <b className="text-white">{a?.name}</b> and <b className="text-white">{b?.name}</b> try to converge.
            </p>
          )}
        </>
      )}

      {state.phase === "reveal" && lastRound && (
        <>
          <div className="card-glow pop-in">
            <div className="text-[11px] uppercase tracking-[0.3em] text-flame font-bold">they said…</div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="text-center">
                <div className="text-xs text-white/50">{a?.name}</div>
                <div className="title text-2xl font-black mt-1">{lastRound.a.word}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-white/50">{b?.name}</div>
                <div className="title text-2xl font-black mt-1">{lastRound.b.word}</div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-ghost" onClick={() => gameAction("giveUp")}>
              🍺 Give up · next pair
            </button>
            <button className="btn-primary" onClick={() => gameAction("tally")}>
              Continue
            </button>
          </div>
        </>
      )}

      {state.phase === "won" && lastRound && (
        <div className="card-glow pop-in text-center border-emerald-400/40">
          <div className="text-5xl mb-2">🧠✨</div>
          <div className="title text-2xl font-black">Converged!</div>
          <p className="text-white/70 mt-1">Both said <b className="text-flame">{lastRound.a.word}</b>.</p>
          <button className="btn-primary w-full mt-4" onClick={() => gameAction("nextPair")}>
            Next pair →
          </button>
        </div>
      )}

      {state.history && state.history.length > 1 && (
        <details className="card">
          <summary className="font-bold cursor-pointer select-none">History ({state.history.length})</summary>
          <div className="mt-3 flex flex-col gap-1 text-xs">
            {state.history.map((r, i) => (
              <div key={i} className="flex justify-between text-white/70">
                <span>{r.a.word}</span>
                <span className="text-white/40">+</span>
                <span>{r.b.word}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
