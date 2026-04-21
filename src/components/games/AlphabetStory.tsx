"use client";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { topics } from "@/lib/content/alphabet-story";
import { pickUnseen } from "@/lib/pick";
import { TurnBanner } from "@/components/TurnBanner";

type Sentence = { authorPid: string; text: string; letter: string };
type State = {
  letterIndex: number;
  topic: string | null;
  sentences: Sentence[];
};

export function AlphabetStory() {
  const { room, pid, gameAction } = useStore();
  const [draft, setDraft] = useState("");
  const state = (room?.gameState || {}) as State;

  useEffect(() => {
    setDraft("");
  }, [state.letterIndex]);

  if (!room) return null;
  const writer = room.players[state.letterIndex % room.players.length];
  const amWriter = pid === writer?.id;
  const currentLetter = String.fromCharCode(65 + (state.letterIndex % 26));
  const done = state.letterIndex >= 26;

  const pickTopic = () => {
    const pool = topics[room.intensity];
    const poolKey = `alphabet-story:${room.intensity}`;
    const { item, index, poolSize } = pickUnseen(pool, room.bags?.[poolKey]);
    gameAction("setTopic", { topic: item, poolKey, index, poolSize });
  };

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    if (text.charAt(0).toUpperCase() !== currentLetter) return;
    gameAction("add", { text });
  };

  return (
    <div className="flex flex-col gap-5 pop-in">
      {!state.topic ? (
        <>
          <p className="text-center text-white/70 text-sm">
            Each player adds a sentence starting with the next letter of the alphabet. A → B → … → Z.
          </p>
          <button className="btn-primary h-28 text-lg title" onClick={pickTopic}>
            🎲 PICK A STORY TOPIC
          </button>
          <button className="btn-ghost" onClick={() => gameAction("setTopic", { topic: "a wild night nobody remembers" })}>
            Skip — use default topic
          </button>
        </>
      ) : (
        <>
          <TurnBanner playerId={writer?.id} label={`Your letter: ${currentLetter}`} />

          <div className="card-glow">
            <div className="text-[10px] uppercase tracking-[0.3em] text-white/50">Story topic</div>
            <p className="title text-xl font-bold mt-1 holo-text capitalize">{state.topic}</p>
          </div>

          <div className="card flex flex-col gap-3">
            <div className="text-[10px] uppercase tracking-[0.3em] text-flame">next letter</div>
            <div className="title text-5xl font-black holo-text">{currentLetter}</div>
            {amWriter && !done ? (
              <>
                <textarea
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-3 outline-none focus:ring-2 ring-flame/50 focus:border-flame/40 resize-none"
                  rows={2}
                  placeholder={`Start with "${currentLetter}…"`}
                  maxLength={240}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <button
                  className="btn-primary"
                  onClick={submit}
                  disabled={!draft.trim() || draft.trim().charAt(0).toUpperCase() !== currentLetter}
                >
                  Add to story
                </button>
                {draft.trim() && draft.trim().charAt(0).toUpperCase() !== currentLetter && (
                  <p className="text-xs text-rose-300">Must start with the letter <b>{currentLetter}</b>.</p>
                )}
              </>
            ) : (
              <p className="text-white/60 text-sm">
                {done ? "The alphabet is complete — reset for another round." : `Waiting for ${writer?.name}…`}
              </p>
            )}
          </div>

          {state.sentences.length > 0 && (
            <div className="card flex flex-col gap-2">
              <div className="text-[10px] uppercase tracking-[0.3em] text-white/50">the story so far</div>
              {state.sentences.map((st, i) => (
                <p key={i} className="text-sm text-white/85 leading-relaxed">
                  <span className="text-flame font-black mr-1">{st.letter}</span>
                  {st.text}
                </p>
              ))}
            </div>
          )}

          {done && (
            <button className="btn-primary" onClick={() => gameAction("reset")}>
              🔄 Start a new story
            </button>
          )}
        </>
      )}
    </div>
  );
}
