"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { rules, type GreenGlassRule } from "@/lib/content/green-glass-door";
import { pickUnseen } from "@/lib/pick";
import { TurnBanner } from "@/components/TurnBanner";

type Proposal = { pid: string; word: string; fits: boolean | null };
type State = {
  phase: "idle" | "playing" | "reveal";
  knowerIndex: number;
  rule: GreenGlassRule | null;
  proposals: Proposal[];
};

export function GreenGlassDoor() {
  const { room, pid, gameAction } = useStore();
  const [draft, setDraft] = useState("");
  const state = (room?.gameState || {}) as State;

  if (!room) return null;
  const knower = room.players[state.knowerIndex % room.players.length];
  const amKnower = pid === knower?.id;

  const draw = () => {
    if (!amKnower) return;
    const pool = rules[room.intensity];
    const poolKey = `green-glass-door:${room.intensity}`;
    const { item, index, poolSize } = pickUnseen(pool, room.bags?.[poolKey]);
    gameAction("draw", { rule: item, poolKey, index, poolSize });
  };

  const propose = () => {
    const text = draft.trim();
    if (!text) return;
    gameAction("propose", { word: text });
    setDraft("");
  };

  return (
    <div className="flex flex-col gap-5 pop-in">
      <TurnBanner playerId={knower?.id} label="🚪 You hold the rule" />

      <div className="card text-center">
        <div className="text-[10px] uppercase tracking-[0.3em] text-white/50">Knower</div>
        <div className="title text-3xl font-black holo-text">{knower?.name}</div>
      </div>

      {state.phase === "idle" && (
        <>
          <p className="text-center text-white/70 text-sm">
            {amKnower
              ? "Draw a hidden rule. You'll say what 'can come through the Green Glass Door' — anything that fits the rule — then judge everyone else's guesses."
              : `Wait for ${knower?.name} to draw a secret rule. Then propose things you think fit. They'll judge.`}
          </p>
          <button className="btn-primary h-28 text-lg title" onClick={draw} disabled={!amKnower}>
            {amKnower ? "🎲 DRAW A RULE" : "…"}
          </button>
        </>
      )}

      {state.phase === "playing" && state.rule && (
        <>
          {amKnower ? (
            <div className="card-glow border-flame/40">
              <div className="text-[11px] uppercase tracking-[0.3em] text-flame font-bold">your secret rule · everyone else sees "?"</div>
              <p className="text-lg font-bold mt-2 leading-snug">{state.rule.text}</p>
              {state.rule.hint && <p className="text-white/60 text-xs mt-1">Hint: {state.rule.hint}</p>}
              {state.rule.examples && state.rule.examples.length > 0 && (
                <p className="text-white/50 text-xs mt-2">
                  Examples that fit: <b className="text-white/80">{state.rule.examples.join(", ")}</b>
                </p>
              )}
            </div>
          ) : (
            <div className="card-glow border-white/30">
              <div className="text-[11px] uppercase tracking-[0.3em] text-white/50">the rule is hidden</div>
              <p className="text-lg font-bold mt-2">Propose what "can come through the Green Glass Door" — the knower says if it fits.</p>
              <div className="mt-3 flex gap-2">
                <input
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-3 outline-none focus:ring-2 ring-flame/50 focus:border-flame/40"
                  placeholder="e.g. bookkeeper"
                  maxLength={60}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && propose()}
                />
                <button className="btn-primary !px-4" onClick={propose} disabled={!draft.trim()}>Propose</button>
              </div>
            </div>
          )}

          {state.proposals.length > 0 && (
            <div className="card">
              <div className="text-[10px] uppercase tracking-widest text-white/50 mb-2">proposals ({state.proposals.length})</div>
              <div className="flex flex-col gap-2">
                {state.proposals.map((p, i) => {
                  const author = room.players.find((pl) => pl.id === p.pid);
                  return (
                    <div key={i} className="flex items-center justify-between gap-2 text-sm">
                      <div className="flex-1">
                        <b className="text-white">{p.word}</b>
                        <span className="text-white/40 text-xs ml-2">— {author?.name}</span>
                      </div>
                      {p.fits === null ? (
                        amKnower ? (
                          <div className="flex gap-1">
                            <button
                              className="chip border-rose-500/40 text-rose-300 hover:bg-rose-500/20"
                              onClick={() => gameAction("judge", { index: i, fits: false })}
                            >
                              🚫
                            </button>
                            <button
                              className="chip border-emerald-400/40 text-emerald-300 hover:bg-emerald-400/20"
                              onClick={() => gameAction("judge", { index: i, fits: true })}
                            >
                              ✓
                            </button>
                          </div>
                        ) : (
                          <span className="chip border-white/15 text-white/50">…</span>
                        )
                      ) : (
                        <span className={`chip border ${p.fits ? "border-emerald-400/40 text-emerald-300" : "border-rose-500/40 text-rose-300"}`}>
                          {p.fits ? "fits" : "no"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button className="btn-ghost" onClick={() => gameAction("reveal")}>🔓 Reveal rule</button>
            <button className="btn-primary" onClick={() => gameAction("next")}>Next knower →</button>
          </div>
        </>
      )}

      {state.phase === "reveal" && state.rule && (
        <>
          <div className="card-glow pop-in">
            <div className="text-[11px] uppercase tracking-[0.3em] text-flame font-bold">the rule was</div>
            <p className="text-lg font-bold mt-2">{state.rule.text}</p>
          </div>
          <button className="btn-primary" onClick={() => gameAction("next")}>Next knower →</button>
        </>
      )}
    </div>
  );
}
