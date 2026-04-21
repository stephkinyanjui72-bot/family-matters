"use client";
import { useStore } from "@/lib/store";
import { locations } from "@/lib/content/the-imposter";
import { pickUnseen } from "@/lib/pick";

type Phase = "setup" | "playing" | "voting" | "reveal";
type State = {
  phase: Phase;
  location: string | null;
  imposterPid: string | null;
  askedIndex: number;
  votes: Record<string, string>;
  caught: "imposter" | "innocent" | null;
};

export function TheImposter() {
  const { room, pid, gameAction } = useStore();
  const state = (room?.gameState || {}) as State;

  if (!room) return null;
  const amImposter = pid === state.imposterPid;
  const asker = room.players[state.askedIndex % room.players.length];
  const amAsker = pid === asker?.id;
  const myVote = pid ? state.votes?.[pid] : undefined;

  const start = () => {
    const pool = locations[room.intensity];
    const poolKey = `the-imposter:${room.intensity}`;
    const { item, index, poolSize } = pickUnseen(pool, room.bags?.[poolKey]);
    gameAction("startGame", { location: item, poolKey, index, poolSize });
  };

  return (
    <div className="flex flex-col gap-5 pop-in">
      <div className="card text-center">
        <div className="text-4xl">🕵️</div>
        <div className="title text-2xl font-black mt-1 holo-text">The Imposter</div>
        <p className="text-white/60 text-xs mt-2 uppercase tracking-widest">one of you doesn't know where we are</p>
      </div>

      {state.phase === "setup" && (
        <>
          <p className="text-center text-white/70 text-sm">
            Everyone will see a secret location — except the imposter (one random player), who sees "?". Take turns asking each other vague questions about "this place" and try to sniff out who doesn't know.
          </p>
          <button className="btn-primary h-28 text-lg title" onClick={start}>
            🎲 DEAL ROLES + LOCATION
          </button>
        </>
      )}

      {state.phase === "playing" && (
        <>
          <div className={`card-glow ${amImposter ? "border-rose-500/40" : "border-emerald-400/40"}`}>
            <div className="text-[11px] uppercase tracking-[0.3em] font-bold" style={{ color: amImposter ? "#ff6b8a" : "#34d399" }}>
              {amImposter ? "you are the imposter" : "location"}
            </div>
            <p className="title text-2xl font-black mt-2 capitalize">
              {amImposter ? "❓ you don't know where we are" : state.location}
            </p>
            <p className="text-white/60 text-sm mt-3">
              {amImposter
                ? "Bluff. Ask vague questions about 'this place' without giving away that you don't know. Guess the location at the end to win."
                : "Ask each other about this place. Try to catch the imposter without giving the location away."}
            </p>
          </div>

          <div className="card text-center">
            <div className="text-[10px] uppercase tracking-widest text-white/50">asker on the clock</div>
            <div className="title text-xl font-black mt-1">{asker?.name}</div>
            <p className="text-xs text-white/50 mt-1">
              {amAsker ? "Ask one player a question about 'this place'." : `${asker?.name} asks one player a question.`}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button className="btn-ghost" onClick={() => gameAction("nextAsker")}>
              Next asker →
            </button>
            <button className="btn-primary" onClick={() => gameAction("startVote")}>
              🕵️ Call a vote
            </button>
          </div>
        </>
      )}

      {state.phase === "voting" && (
        <>
          <div className="card-glow">
            <div className="text-[11px] uppercase tracking-[0.3em] text-flame font-bold">who is the imposter?</div>
            <p className="text-white/70 text-sm mt-2">
              Tap the player you think doesn't know the location.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {room.players.map((p) => (
              <button
                key={p.id}
                disabled={p.id === pid}
                onClick={() => gameAction("vote", { playerId: p.id })}
                className={`rounded-2xl py-3 px-3 border font-bold transition-all ${
                  myVote === p.id
                    ? "bg-gradient-to-br from-flame to-ember border-white/40 text-white shadow-lg shadow-flame/40"
                    : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                } ${p.id === pid ? "opacity-40" : ""}`}
              >
                {p.name}
              </button>
            ))}
          </div>
          <button className="btn-primary" onClick={() => gameAction("resolve")}>
            Lock in votes
          </button>
        </>
      )}

      {state.phase === "reveal" && (
        <>
          <div className={`card-glow text-center pop-in ${state.caught === "imposter" ? "border-emerald-400/50" : "border-rose-500/50"}`}>
            <div className="text-5xl mb-2">{state.caught === "imposter" ? "🎯" : "🕵️"}</div>
            <div className="title text-2xl font-black">
              {state.caught === "imposter" ? "Imposter caught!" : "Imposter escapes!"}
            </div>
            <p className="text-white/70 mt-2 text-sm">
              The imposter was <b>{room.players.find((p) => p.id === state.imposterPid)?.name}</b>.
            </p>
            <p className="text-white/70 mt-1 text-sm">
              Location: <b className="text-flame capitalize">{state.location}</b>
            </p>
          </div>
          <button className="btn-primary" onClick={() => gameAction("reset")}>
            🔄 New round
          </button>
        </>
      )}
    </div>
  );
}
