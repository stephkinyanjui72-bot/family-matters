"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { TurnBanner } from "@/components/TurnBanner";

type Entry = { authorPid: string; name: string };
type State = {
  turnIndex: number;
  chain: Entry[];
};

function lastLetter(name: string): string | null {
  const clean = name.trim().replace(/[^a-zA-Z ]/g, "");
  if (!clean) return null;
  // Use the last letter of the FULL name (surname typically).
  return clean.charAt(clean.length - 1).toUpperCase();
}

export function NameGame() {
  const { room, pid, gameAction } = useStore();
  const [draft, setDraft] = useState("");
  const state = (room?.gameState || {}) as State;

  if (!room) return null;
  const current = room.players[state.turnIndex % room.players.length];
  const amCurrent = pid === current?.id;
  const lastInChain = state.chain[state.chain.length - 1];
  const needsLetter = lastInChain ? lastLetter(lastInChain.name) : null;

  const submit = () => {
    const name = draft.trim();
    if (!name) return;
    gameAction("addName", { name });
    setDraft("");
  };

  return (
    <div className="flex flex-col gap-5 pop-in">
      <TurnBanner playerId={current?.id} label="Name a celebrity" />

      <div className="card-glow text-center">
        <div className="text-[10px] uppercase tracking-[0.3em] text-white/50">Name must start with</div>
        <div className="title text-6xl font-black mt-1 holo-text">
          {needsLetter ?? "ANY"}
        </div>
        {lastInChain && (
          <p className="text-white/60 text-xs mt-2">Last: <b className="text-white">{lastInChain.name}</b></p>
        )}
      </div>

      {amCurrent ? (
        <div className="card flex flex-col gap-3">
          <input
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-flame/50 focus:border-flame/40"
            placeholder={needsLetter ? `e.g. ${needsLetter}omeone famous` : "Any celebrity"}
            value={draft}
            maxLength={60}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-ghost" onClick={() => gameAction("giveUp")}>
              🍺 I give up · drink
            </button>
            <button className="btn-primary" onClick={submit} disabled={!draft.trim()}>
              Lock in
            </button>
          </div>
        </div>
      ) : (
        <p className="text-center text-white/50 text-sm">Waiting for {current?.name}…</p>
      )}

      {state.chain.length > 0 && (
        <div className="card">
          <div className="text-[10px] uppercase tracking-[0.3em] text-white/50 mb-2">Chain ({state.chain.length})</div>
          <div className="flex flex-wrap gap-2 text-xs">
            {state.chain.map((e, i) => (
              <span key={i} className="chip border-white/15 text-white/75">
                {e.name}
              </span>
            ))}
          </div>
          <button className="btn-ghost w-full mt-3 !py-2 !text-xs" onClick={() => gameAction("reset")}>
            🔄 New chain
          </button>
        </div>
      )}
    </div>
  );
}
