"use client";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { starterRules } from "@/lib/content/cheers-to-the-governor";
import { TurnBanner } from "@/components/TurnBanner";

type State = {
  turnIndex: number;
  count: number;
  rules: Record<string, string>;
  pendingRule: boolean;
  reached21: number;
};

export function CheersToTheGovernor() {
  const { room, pid, gameAction } = useStore();
  const [ruleText, setRuleText] = useState("");
  const [ruleNum, setRuleNum] = useState<number | null>(null);
  const state = (room?.gameState || {}) as State;

  // Seed starter rules once on first entry so the game has texture.
  useEffect(() => {
    if (!room) return;
    if (!state.rules || Object.keys(state.rules).length > 0) return;
    const seed = starterRules[room.intensity];
    const seedRules: Record<string, string> = {};
    seed.forEach((s) => { seedRules[String(s.number)] = s.rule; });
    gameAction("seedRules", { rules: seedRules });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.code, room?.intensity]);

  useEffect(() => {
    if (!state.pendingRule) {
      setRuleText("");
      setRuleNum(null);
    }
  }, [state.pendingRule]);

  if (!room) return null;
  const caller = room.players[state.turnIndex % room.players.length];
  const amCaller = pid === caller?.id;
  const nextNumber = Math.min(21, (state.count || 0) + 1);
  const ruleForNext = state.rules?.[String(nextNumber)];
  const availableSlots: number[] = [];
  for (let i = 1; i <= 21; i++) if (!state.rules?.[String(i)]) availableSlots.push(i);

  return (
    <div className="flex flex-col gap-5 pop-in">
      <TurnBanner playerId={caller?.id} label={state.pendingRule ? "You hit 21 — make a rule" : "Your turn to call"} />

      {!state.pendingRule && (
        <>
          <div className="card-glow text-center">
            <div className="text-[11px] uppercase tracking-[0.3em] text-flame font-bold">next number</div>
            <div className="title text-7xl font-black mt-2 holo-text">{nextNumber}</div>
            {ruleForNext && (
              <div className="mt-3 bg-flame/10 border border-flame/30 rounded-2xl p-3">
                <div className="text-[10px] uppercase tracking-[0.3em] text-flame font-bold">rule for {nextNumber}</div>
                <p className="text-white/90 text-sm mt-1 font-bold">{ruleForNext}</p>
              </div>
            )}
            <p className="text-white/60 text-xs mt-3">
              {amCaller ? `Say "${nextNumber}" out loud${ruleForNext ? " — and the rule" : ""}.` : `Waiting for ${caller?.name} to say ${nextNumber}…`}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button className="btn-ghost" onClick={() => gameAction("mistake")}>
              🍺 Someone drank
            </button>
            <button className="btn-primary" onClick={() => gameAction("tick")} disabled={!amCaller}>
              Said it · next →
            </button>
          </div>
        </>
      )}

      {state.pendingRule && (
        <div className="card-glow flex flex-col gap-3">
          <div className="text-[11px] uppercase tracking-[0.3em] text-flame font-bold">cheers to {caller?.name}</div>
          <p className="text-sm text-white/70">
            {amCaller
              ? "Pick an open number and write a new rule. Players must follow it whenever the count hits that number."
              : `Waiting for ${caller?.name} to set a rule…`}
          </p>

          {amCaller && (
            <>
              <div className="grid grid-cols-6 gap-2">
                {availableSlots.map((n) => (
                  <button
                    key={n}
                    onClick={() => setRuleNum(n)}
                    className={`rounded-xl py-2 text-sm font-bold border transition ${
                      ruleNum === n
                        ? "bg-gradient-to-br from-flame to-ember border-white/30 text-white"
                        : "bg-white/5 border-white/10 text-white/70"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <textarea
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-3 outline-none focus:ring-2 ring-flame/50 focus:border-flame/40 resize-none"
                rows={2}
                placeholder={ruleNum ? `Rule for ${ruleNum}: e.g. "Blow a kiss before saying ${ruleNum}."` : "Pick a number first…"}
                maxLength={180}
                value={ruleText}
                onChange={(e) => setRuleText(e.target.value)}
                disabled={!ruleNum}
              />
              <div className="grid grid-cols-2 gap-2">
                <button className="btn-ghost" onClick={() => gameAction("skipRule")}>
                  Skip — keep playing
                </button>
                <button
                  className="btn-primary"
                  disabled={!ruleNum || !ruleText.trim()}
                  onClick={() => gameAction("addRule", { number: ruleNum, rule: ruleText.trim() })}
                >
                  Add rule
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {Object.keys(state.rules || {}).length > 0 && (
        <details className="card">
          <summary className="font-bold cursor-pointer select-none">Active rules ({Object.keys(state.rules).length})</summary>
          <div className="mt-3 flex flex-col gap-2">
            {Object.entries(state.rules)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([num, rule]) => (
                <div key={num} className="flex gap-3 items-start text-sm">
                  <span className="chip border-flame/40 text-flame font-black shrink-0">{num}</span>
                  <span className="text-white/80">{rule}</span>
                </div>
              ))}
          </div>
        </details>
      )}

      <p className="text-center text-white/40 text-[11px] uppercase tracking-widest">
        round {state.reached21 || 0} · count {state.count || 0}/21
      </p>
    </div>
  );
}
