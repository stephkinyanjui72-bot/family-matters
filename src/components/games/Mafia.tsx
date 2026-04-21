"use client";
import { useStore } from "@/lib/store";

type Phase = "setup" | "night" | "day" | "over";
type Role = "mafia" | "detective" | "villager";
type HistEntry = { day: number; killed: string | null; lynched: string | null };

type State = {
  phase: Phase;
  dayNumber: number;
  roles: Record<string, Role>;
  alive: string[];
  mafiaTarget: string | null;
  detectiveCheck: { target: string; role: Role } | null;
  dayVotes: Record<string, string>;
  history: HistEntry[];
  winner: "mafia" | "villagers" | null;
};

const ROLE_LABEL: Record<Role, string> = {
  mafia: "🕴️ Mafia",
  detective: "🔍 Detective",
  villager: "👤 Villager",
};

export function Mafia() {
  const { room, pid, gameAction } = useStore();
  const state = (room?.gameState || {}) as State;

  if (!room) return null;
  const myRole = pid ? state.roles?.[pid] : undefined;
  const amAlive = pid && state.alive?.includes(pid);
  const aliveMafia = (state.alive || []).filter((id) => state.roles?.[id] === "mafia");
  const mafiaTarget = state.mafiaTarget ? room.players.find((p) => p.id === state.mafiaTarget) : null;
  const tally: Record<string, number> = {};
  Object.values(state.dayVotes || {}).forEach((t) => { tally[t] = (tally[t] || 0) + 1; });

  return (
    <div className="flex flex-col gap-5 pop-in">
      <div className="card text-center">
        <div className="text-[10px] uppercase tracking-[0.3em] text-white/50">
          {state.phase === "setup" ? "Set up" : state.phase === "over" ? "Game over" : `Day ${state.dayNumber} · ${state.phase}`}
        </div>
        {myRole && state.phase !== "over" && (
          <div className="title text-2xl font-black mt-1 holo-text">{ROLE_LABEL[myRole]}</div>
        )}
        {myRole === "mafia" && state.phase !== "setup" && state.phase !== "over" && aliveMafia.length > 0 && (
          <p className="text-white/60 text-xs mt-2">
            Other mafia: {aliveMafia.filter((id) => id !== pid).map((id) => room.players.find((p) => p.id === id)?.name).join(", ") || "none"}
          </p>
        )}
      </div>

      {state.phase === "setup" && (
        <>
          <p className="text-center text-white/70 text-sm">
            Roles are assigned randomly. Mafia try to kill everyone; villagers lynch mafia by day. Detective can investigate one player each night.
          </p>
          <button className="btn-primary h-28 text-lg title" onClick={() => gameAction("startGame")}>
            🎲 DEAL ROLES
          </button>
        </>
      )}

      {state.phase === "night" && (
        <>
          <div className="card-glow">
            <div className="text-[11px] uppercase tracking-[0.3em] text-flame font-bold">night falls</div>
            <p className="text-sm text-white/80 mt-2">
              {myRole === "mafia"
                ? "Pick your victim. Mafia agree on one target — last tap wins."
                : myRole === "detective"
                ? "Pick a player to investigate. You'll learn their role."
                : amAlive
                ? "Close your eyes. Mafia and Detective are acting."
                : "You're dead. Watch quietly."}
            </p>
          </div>

          {myRole === "mafia" && amAlive && (
            <div className="flex flex-col gap-2">
              <div className="text-[10px] uppercase tracking-widest text-rose-300">Target</div>
              {state.alive
                .filter((id) => state.roles[id] !== "mafia")
                .map((id) => {
                  const p = room.players.find((pl) => pl.id === id);
                  if (!p) return null;
                  return (
                    <button
                      key={id}
                      onClick={() => gameAction("mafiaVote", { playerId: id })}
                      className={`rounded-2xl py-3 px-4 border font-bold text-left transition-all ${
                        state.mafiaTarget === id
                          ? "bg-gradient-to-br from-flame to-ember border-white/40 text-white"
                          : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                      }`}
                    >
                      {p.name}
                    </button>
                  );
                })}
              {mafiaTarget && <p className="text-xs text-white/60">Locked in: {mafiaTarget.name}</p>}
            </div>
          )}

          {myRole === "detective" && amAlive && (
            <div className="flex flex-col gap-2">
              <div className="text-[10px] uppercase tracking-widest text-sky-300">Investigate</div>
              {state.alive
                .filter((id) => id !== pid)
                .map((id) => {
                  const p = room.players.find((pl) => pl.id === id);
                  if (!p) return null;
                  return (
                    <button
                      key={id}
                      onClick={() => gameAction("detectiveCheck", { playerId: id })}
                      className={`rounded-2xl py-3 px-4 border font-bold text-left transition-all ${
                        state.detectiveCheck?.target === id
                          ? "bg-gradient-to-br from-sky-500 to-indigo-600 border-white/40 text-white"
                          : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                      }`}
                    >
                      {p.name}
                    </button>
                  );
                })}
              {state.detectiveCheck && (
                <div className="card border-sky-400/30 mt-2">
                  <div className="text-[10px] uppercase tracking-widest text-sky-300">report</div>
                  <p className="text-sm mt-1">
                    <b>{room.players.find((p) => p.id === state.detectiveCheck!.target)?.name}</b> is{" "}
                    <b className="text-flame">{ROLE_LABEL[state.detectiveCheck.role]}</b>.
                  </p>
                </div>
              )}
            </div>
          )}

          <button className="btn-primary" onClick={() => gameAction("resolveNight")}>
            🌙 End night
          </button>
        </>
      )}

      {state.phase === "day" && (
        <>
          <div className="card-glow border-emerald-400/30">
            <div className="text-[11px] uppercase tracking-[0.3em] text-emerald-300 font-bold">the sun rises</div>
            {state.history[state.history.length - 1]?.killed ? (
              <p className="text-sm text-white/85 mt-2">
                <b>{room.players.find((p) => p.id === state.history[state.history.length - 1].killed!)?.name}</b> was found dead. The mafia strikes again.
              </p>
            ) : (
              <p className="text-sm text-white/85 mt-2">Nobody died tonight. Suspicious.</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-[10px] uppercase tracking-widest text-white/60">Vote to lynch</div>
            {state.alive.map((id) => {
              const p = room.players.find((pl) => pl.id === id);
              if (!p) return null;
              const myVote = pid ? state.dayVotes?.[pid] === id : false;
              const count = tally[id] || 0;
              return (
                <button
                  key={id}
                  onClick={() => amAlive && gameAction("dayVote", { playerId: id })}
                  disabled={!amAlive}
                  className={`rounded-2xl py-3 px-4 border font-bold text-left transition-all flex items-center justify-between ${
                    myVote
                      ? "bg-gradient-to-br from-flame to-ember border-white/40 text-white"
                      : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                  }`}
                >
                  <span>{p.name}</span>
                  {count > 0 && <span className="chip border-white/20 bg-black/20">{count}</span>}
                </button>
              );
            })}
          </div>

          <button className="btn-primary" onClick={() => gameAction("resolveDay")}>
            ☀️ Resolve lynch
          </button>
        </>
      )}

      {state.phase === "over" && (
        <>
          <div className={`card-glow text-center pop-in ${state.winner === "villagers" ? "border-emerald-400/50" : "border-rose-500/50"}`}>
            <div className="text-5xl mb-2">{state.winner === "villagers" ? "🎉" : "🕴️"}</div>
            <div className="title text-3xl font-black">
              {state.winner === "villagers" ? "Villagers win" : "Mafia wins"}
            </div>
          </div>

          <div className="card">
            <div className="text-[10px] uppercase tracking-widest text-white/60 mb-2">Roles</div>
            {room.players.map((p) => (
              <div key={p.id} className="flex justify-between text-sm py-1">
                <span>{p.name}</span>
                <span className="text-white/60">{ROLE_LABEL[state.roles[p.id]] || "—"}</span>
              </div>
            ))}
          </div>

          <button className="btn-primary" onClick={() => gameAction("reset")}>🔄 New game</button>
        </>
      )}

      {state.history && state.history.length > 0 && state.phase !== "over" && (
        <details className="card">
          <summary className="font-bold cursor-pointer select-none">History ({state.history.length} night{state.history.length === 1 ? "" : "s"})</summary>
          <div className="mt-3 flex flex-col gap-1 text-xs">
            {state.history.map((h, i) => (
              <div key={i} className="flex justify-between text-white/70">
                <span>Day {h.day}</span>
                <span>
                  {h.killed ? `🩸 ${room.players.find((p) => p.id === h.killed!)?.name}` : "—"}
                  {h.lynched && ` · ⚖️ ${room.players.find((p) => p.id === h.lynched!)?.name}`}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
