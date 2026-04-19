"use client";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { TurnBanner } from "@/components/TurnBanner";

export function TwoTruths() {
  const { room, isHost, pid, gameAction } = useStore();
  const [s1, setS1] = useState("");
  const [s2, setS2] = useState("");
  const [s3, setS3] = useState("");
  const [lieIdx, setLieIdx] = useState<0 | 1 | 2>(2);

  const state = (room?.gameState || {}) as {
    turnIndex: number;
    statements: { text: string; isLie: boolean }[] | null;
    votes: Record<string, number>;
    revealedLie: number | null;
  };

  useEffect(() => {
    if (!state.statements) { setS1(""); setS2(""); setS3(""); setLieIdx(2); }
  }, [state.statements, state.turnIndex]);

  if (!room) return null;
  const teller = room.players[state.turnIndex % room.players.length];
  const amTeller = pid === teller?.id;
  const myVote = pid ? state.votes?.[pid] : undefined;

  const submit = () => {
    if (!s1.trim() || !s2.trim() || !s3.trim()) return;
    const statements = [s1, s2, s3].map((text, i) => ({ text: text.trim(), isLie: i === lieIdx }));
    gameAction("submit", { statements });
  };

  return (
    <div className="flex flex-col gap-5 pop-in">
      <TurnBanner playerId={teller?.id} label="You're the teller" />
      <div className="card text-center">
        <div className="text-[10px] uppercase tracking-[0.3em] text-white/50">Teller</div>
        <div className="title text-3xl font-black holo-text">{teller?.name}</div>
      </div>

      {!state.statements && amTeller && (
        <div className="card-glow flex flex-col gap-3">
          <p className="text-sm text-white/70">
            Write <b className="text-flame">2 truths and 1 lie</b>. Mark which one is the lie. Others vote.
          </p>
          {[s1, s2, s3].map((v, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-3 outline-none focus:ring-2 ring-flame/50 focus:border-flame/40"
                placeholder={`Statement ${i + 1}`}
                value={v}
                onChange={(e) => [setS1, setS2, setS3][i](e.target.value)}
                maxLength={120}
              />
              <button
                className={`chip whitespace-nowrap ${lieIdx === i ? "border-flame text-flame bg-flame/10" : "border-white/20 text-white/50"}`}
                onClick={() => setLieIdx(i as 0 | 1 | 2)}
              >
                🚨 lie
              </button>
            </div>
          ))}
          <button className="btn-primary mt-2" onClick={submit}>Submit statements</button>
        </div>
      )}

      {!state.statements && !amTeller && (
        <p className="text-center text-white/50 text-sm">Waiting for <b className="text-white">{teller?.name}</b> to submit…</p>
      )}

      {state.statements && (
        <div className="flex flex-col gap-2">
          {state.statements.map((st, i) => {
            const isLie = state.revealedLie === i;
            const voteCount = Object.values(state.votes || {}).filter((v) => v === i).length;
            return (
              <button
                key={i}
                disabled={amTeller || state.revealedLie !== null}
                onClick={() => gameAction("vote", { index: i })}
                className={`card text-left transition-all ${
                  myVote === i ? "border-flame shadow-lg shadow-flame/30" : ""
                } ${isLie ? "border-rose-500 !bg-rose-500/20" : ""}`}
              >
                <div className="text-[10px] uppercase tracking-[0.3em] text-white/50">#{i + 1}</div>
                <div className="font-bold mt-1 text-lg">{st.text}</div>
                {state.revealedLie !== null && (
                  <div className="text-xs mt-2 font-bold">
                    {isLie ? "🚨 THE LIE" : "✓ true"} · {voteCount} vote{voteCount === 1 ? "" : "s"}
                  </div>
                )}
              </button>
            );
          })}
          {isHost && state.revealedLie === null && (
            <button
              className="btn-ghost"
              onClick={() => {
                const lieIndex = state.statements!.findIndex((s) => s.isLie);
                gameAction("reveal", { index: lieIndex });
              }}
            >
              Reveal the lie ({Object.keys(state.votes || {}).length}/{room.players.length - 1} voted)
            </button>
          )}
          {state.revealedLie !== null && isHost && (
            <button className="btn-primary" onClick={() => gameAction("next")}>Next teller →</button>
          )}
        </div>
      )}
    </div>
  );
}
