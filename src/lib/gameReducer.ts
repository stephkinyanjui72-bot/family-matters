// Pure game-rule logic. Used by the API routes to validate and apply
// game:action events before persisting state to Supabase.
//
// No I/O, no database, no socket. Input: current state + action + room snapshot.
// Output: next state (or null if the action was rejected).

import type { GameId, Intensity } from "./types";

export type Player = {
  id: string;       // stable pid across reconnects
  name: string;
  isHost: boolean;
  online: boolean;
};

export type RoomSnapshot = {
  code: string;
  hostId: string;
  intensity: Intensity;
  players: Player[];
  currentGame: GameId | null;
  gameState: unknown;
  bags: Record<string, number[]>;
};

export const MIN_PLAYERS: Record<GameId, number> = {
  "truth-or-dare": 2,
  "do-or-drink": 2,
  "never-have-i-ever": 3,
  "most-likely-to": 3,
  "would-you-rather": 2,
  "paranoia": 3,
  "spin-the-bottle": 3,
  "two-truths-and-a-lie": 3,
  "hot-seat": 3,
  "kiss-marry-avoid": 2,
  "fictionary": 3,
  "five-second": 2,
  "forbidden-phrases": 3,
  "cheers-to-the-governor": 3,
  "psychologist": 4,
  "alphabet-story": 3,
  "ghost": 3,
  "name-game": 3,
  "rapid-fire": 3,
  "press-conference": 4,
  "hows-yours": 4,
  "sorry-im-late": 4,
  "the-jar": 3,
  "say-the-same-thing": 3,
};

export function initialGameState(gameId: GameId): unknown {
  switch (gameId) {
    case "truth-or-dare": return { turnIndex: 0, pick: null, prompt: null };
    case "do-or-drink": return { turnIndex: 0, challenge: null };
    case "never-have-i-ever": return { turnIndex: 0, prompt: null };
    case "most-likely-to": return { prompt: null, votes: {}, revealed: false };
    case "would-you-rather": return { prompt: null, votes: {}, revealed: false };
    case "paranoia": return { askerIndex: 0, targetId: null, prompt: null, revealed: false };
    case "spin-the-bottle": return { spinning: false, pickerIndex: null, targetIndex: null, seed: 0 };
    case "two-truths-and-a-lie": return { turnIndex: 0, statements: null, votes: {}, revealedLie: null };
    case "hot-seat": return { victimIndex: 0, prompt: null };
    case "kiss-marry-avoid": return { turnIndex: 0, options: null, choices: {} };
    case "fictionary": return {
      turnIndex: 0,
      word: null,            // { word, definition } once drawn
      submissions: {},       // pid -> fake definition
      phase: "idle",         // idle | submit | vote | reveal
      order: null,           // shuffled [{text, authorPid|'real'}] once we move to vote
      votes: {},             // pid -> index into order
    };
    case "five-second": return {
      turnIndex: 0,
      prompt: null,
      startedAt: null,       // ms timestamp — client derives 5-sec countdown
      outcome: null,         // null | 'pass' | 'fail'
    };
    case "forbidden-phrases": return {
      turnIndex: 0,
      prompt: null,
      forbidden: null,       // [word1, word2]
      startedAt: null,
      outcome: null,         // null | 'caught' | 'survived'
    };
    case "cheers-to-the-governor": return {
      turnIndex: 0,
      count: 0,              // last number counted; next turn says count+1
      rules: {},             // { [num]: string }
      pendingRule: false,    // true when someone just hit 21 and must add a rule
      reached21: 0,          // how many full 1-21 rounds completed
    };
    case "psychologist": return {
      psychologistIndex: 0,  // current guesser
      rule: null,            // string; hidden from the psychologist client-side
      phase: "idle",         // idle | playing | reveal
    };
    case "alphabet-story": return {
      letterIndex: 0,        // 0 = A … 25 = Z, wraps
      topic: null,           // optional "write a story about X"
      sentences: [],         // [{ authorPid, text, letter }]
    };
    case "ghost": return {
      turnIndex: 0,
      letters: "",           // accumulated string (uppercase)
      score: {},             // pid -> 0..5 (GHOST)
      out: [],               // pids eliminated
    };
    case "name-game": return {
      turnIndex: 0,
      chain: [],             // [{ authorPid, name }]
    };
    case "rapid-fire": return {
      victimIndex: 0,
      prompts: null,         // string[] shown during the round
      startedAt: null,
      outcome: null,         // 'survived' | 'drank'
    };
    case "press-conference": return {
      subjectIndex: 0,       // person being interviewed
      identity: null,        // string, hidden from subject client-side
      phase: "idle",         // idle | playing | reveal
    };
    case "hows-yours": return {
      guesserIndex: 0,       // the one asking "how's yours?"
      topic: null,           // hidden from guesser
      phase: "idle",
    };
    case "sorry-im-late": return {
      lateIndex: 0,          // player who's "late"
      reason: null,          // hidden from late player
      phase: "idle",
    };
    case "the-jar": return {
      phase: "submit",       // submit | reading | done
      submissions: {},       // pid -> confession text
      order: null,           // shuffled [{authorPid, text}]
      readIndex: 0,          // which confession we're on
      votes: {},             // string(readIndex) -> { voterPid -> guessedPid }
      revealed: false,       // current confession author revealed
    };
    case "say-the-same-thing": return {
      pairIndex: 0,          // rotates pair; pairA = 2*pairIndex, pairB = 2*pairIndex+1
      submissions: {},       // pid -> latest word for current round
      history: [],           // [{ a: {pid,word}, b: {pid,word} }]
      phase: "submit",       // submit | reveal | won
    };
  }
}

export function recordDrawn(
  bags: Record<string, number[]>,
  key: string | undefined,
  index: number | undefined,
  size: number | undefined,
): Record<string, number[]> {
  if (!key || typeof index !== "number" || typeof size !== "number" || size <= 0) return bags;
  const prior = bags[key] || [];
  const next = prior.includes(index) ? prior : [...prior, index];
  const updated = next.length >= size ? [index] : next;
  return { ...bags, [key]: updated };
}

export function normalizeGameState(room: RoomSnapshot): RoomSnapshot {
  if (!room.currentGame || !room.gameState) return room;
  const n = room.players.length;
  if (n === 0) return { ...room, currentGame: null, gameState: null };
  const min = MIN_PLAYERS[room.currentGame] || 2;
  if (n < min) return { ...room, currentGame: null, gameState: null };

  const s = { ...(room.gameState as Record<string, unknown>) };
  if (typeof s.turnIndex === "number") s.turnIndex = s.turnIndex % n;
  if (typeof s.askerIndex === "number") s.askerIndex = s.askerIndex % n;
  if (typeof s.victimIndex === "number") s.victimIndex = s.victimIndex % n;

  const livePids = new Set(room.players.map((p) => p.id));
  if (s.votes && typeof s.votes === "object") {
    s.votes = Object.fromEntries(
      Object.entries(s.votes as Record<string, unknown>).filter(([pid]) => livePids.has(pid)),
    );
  }
  if (s.choices && typeof s.choices === "object") {
    s.choices = Object.fromEntries(
      Object.entries(s.choices as Record<string, unknown>).filter(([pid]) => livePids.has(pid)),
    );
  }
  if (room.currentGame === "paranoia" && s.targetId && !livePids.has(s.targetId as string)) {
    s.targetId = null;
    s.prompt = null;
    s.revealed = false;
  }
  if (room.currentGame === "spin-the-bottle") {
    if (typeof s.pickerIndex === "number") s.pickerIndex = s.pickerIndex % n;
    if (typeof s.targetIndex === "number") s.targetIndex = s.targetIndex % n;
  }
  return { ...room, gameState: s };
}

type ReduceResult = { gameState: unknown; bags: Record<string, number[]> } | null;

type AnyAction = { type: string; payload?: Record<string, unknown> };

export function reduceGame(
  gameId: GameId,
  state: unknown,
  action: AnyAction,
  actorPid: string,
  room: RoomSnapshot,
): ReduceResult {
  if (!state || !action || typeof action !== "object") return null;
  const s = state as Record<string, unknown>;
  const n = room.players.length;
  const currentByTurn = () => room.players[((s.turnIndex as number) || 0) % n];
  const isHost = actorPid === room.hostId;
  const bags = room.bags || {};
  const p = (action.payload || {}) as Record<string, unknown>;

  switch (gameId) {
    case "truth-or-dare": {
      // `pick` keeps the "current-player-or-host" rule — you shouldn't draw
      // someone else's truth/dare for them. Everything else is open.
      if (action.type === "pick") {
        if (actorPid !== currentByTurn().id && !isHost) return null;
        if (!["truth", "dare"].includes(p.kind as string)) return null;
        const nextBags = recordDrawn(bags, p.poolKey as string, p.index as number, p.poolSize as number);
        return { gameState: { ...s, pick: p.kind, prompt: String(p.prompt || "") }, bags: nextBags };
      }
      if (action.type === "next") {
        return { gameState: { ...s, turnIndex: (((s.turnIndex as number) || 0) + 1) % n, pick: null, prompt: null }, bags };
      }
      return null;
    }
    case "do-or-drink": {
      if (action.type === "reveal") {
        const nextBags = recordDrawn(bags, p.poolKey as string, p.index as number, p.poolSize as number);
        return { gameState: { ...s, challenge: String(p.challenge || "") }, bags: nextBags };
      }
      if (action.type === "next") {
        return { gameState: { ...s, turnIndex: (((s.turnIndex as number) || 0) + 1) % n, challenge: null }, bags };
      }
      return null;
    }
    case "never-have-i-ever": {
      if (action.type === "reveal") {
        const nextBags = recordDrawn(bags, p.poolKey as string, p.index as number, p.poolSize as number);
        return { gameState: { ...s, prompt: String(p.prompt || "") }, bags: nextBags };
      }
      if (action.type === "next") {
        return { gameState: { ...s, turnIndex: (((s.turnIndex as number) || 0) + 1) % n, prompt: null }, bags };
      }
      return null;
    }
    case "most-likely-to": {
      if (action.type === "reveal") {
        const nextBags = recordDrawn(bags, p.poolKey as string, p.index as number, p.poolSize as number);
        return { gameState: { ...s, prompt: String(p.prompt || ""), votes: {}, revealed: false }, bags: nextBags };
      }
      if (action.type === "vote") {
        const target = p.playerId as string;
        if (!target || !room.players.some((pl) => pl.id === target)) return null;
        return { gameState: { ...s, votes: { ...(s.votes as object || {}), [actorPid]: target } }, bags };
      }
      if (action.type === "tally") return { gameState: { ...s, revealed: true }, bags };
      if (action.type === "next") return { gameState: { ...s, prompt: null, votes: {}, revealed: false }, bags };
      return null;
    }
    case "would-you-rather": {
      if (action.type === "reveal") {
        const nextBags = recordDrawn(bags, p.poolKey as string, p.index as number, p.poolSize as number);
        return { gameState: { ...s, prompt: p.prompt ?? null, votes: {}, revealed: false }, bags: nextBags };
      }
      if (action.type === "vote") {
        if (!["a", "b"].includes(p.choice as string)) return null;
        return { gameState: { ...s, votes: { ...(s.votes as object || {}), [actorPid]: p.choice } }, bags };
      }
      if (action.type === "tally") return { gameState: { ...s, revealed: true }, bags };
      if (action.type === "next") return { gameState: { ...s, prompt: null, votes: {}, revealed: false }, bags };
      return null;
    }
    case "paranoia": {
      // `ask` stays locked to the asker — nobody else should whisper for them.
      const asker = room.players[((s.askerIndex as number) || 0) % n];
      if (action.type === "ask") {
        if (actorPid !== asker.id) return null;
        const tid = p.targetId as string;
        if (!tid || tid === asker.id || !room.players.some((pl) => pl.id === tid)) return null;
        const nextBags = recordDrawn(bags, p.poolKey as string, p.index as number, p.poolSize as number);
        return { gameState: { ...s, prompt: String(p.prompt || ""), targetId: tid, revealed: false }, bags: nextBags };
      }
      if (action.type === "flipCoin") return { gameState: { ...s, revealed: !!p.revealed }, bags };
      if (action.type === "next") {
        return { gameState: { ...s, askerIndex: (((s.askerIndex as number) || 0) + 1) % n, prompt: null, targetId: null, revealed: false }, bags };
      }
      return null;
    }
    case "spin-the-bottle": {
      if (action.type === "spin") {
        const picker = Math.floor(Math.random() * n);
        let target = Math.floor(Math.random() * n);
        if (n > 1) while (target === picker) target = Math.floor(Math.random() * n);
        return { gameState: { spinning: true, pickerIndex: picker, targetIndex: target, seed: Date.now() }, bags };
      }
      if (action.type === "settle") return { gameState: { ...s, spinning: false }, bags };
      return null;
    }
    case "two-truths-and-a-lie": {
      // `submit` stays locked to the teller — only they know which is the lie.
      const teller = room.players[((s.turnIndex as number) || 0) % n];
      if (action.type === "submit") {
        if (actorPid !== teller.id) return null;
        const st = p.statements as Array<{ text?: string; isLie?: boolean }>;
        if (!Array.isArray(st) || st.length !== 3) return null;
        const normalized = st.map((x) => ({ text: String(x?.text || "").slice(0, 160), isLie: !!x?.isLie }));
        if (normalized.filter((x) => x.isLie).length !== 1) return null;
        return { gameState: { ...s, statements: normalized, votes: {}, revealedLie: null }, bags };
      }
      if (action.type === "vote") {
        if (actorPid === teller.id) return null;
        const idx = p.index as number;
        if (![0, 1, 2].includes(idx)) return null;
        return { gameState: { ...s, votes: { ...(s.votes as object || {}), [actorPid]: idx } }, bags };
      }
      if (action.type === "reveal") {
        const statements = s.statements as Array<{ isLie: boolean }> | null;
        const idx = statements?.findIndex((x) => x.isLie) ?? -1;
        if (idx < 0) return null;
        return { gameState: { ...s, revealedLie: idx }, bags };
      }
      if (action.type === "next") {
        return { gameState: { ...s, turnIndex: (((s.turnIndex as number) || 0) + 1) % n, statements: null, votes: {}, revealedLie: null }, bags };
      }
      return null;
    }
    case "hot-seat": {
      if (action.type === "reveal") {
        const nextBags = recordDrawn(bags, p.poolKey as string, p.index as number, p.poolSize as number);
        return { gameState: { ...s, prompt: String(p.prompt || "") }, bags: nextBags };
      }
      if (action.type === "nextVictim") {
        return { gameState: { ...s, victimIndex: (((s.victimIndex as number) || 0) + 1) % n, prompt: null }, bags };
      }
      return null;
    }
    case "kiss-marry-avoid": {
      // `reveal` stays locked to the current player — the round is theirs.
      const current = room.players[((s.turnIndex as number) || 0) % n];
      if (action.type === "reveal") {
        if (actorPid !== current.id) return null;
        const opts = p.options as unknown[];
        if (!Array.isArray(opts) || opts.length !== 3) return null;
        const nextBags = recordDrawn(bags, p.poolKey as string, p.index as number, p.poolSize as number);
        return { gameState: { ...s, options: opts.map(String), choices: {} }, bags: nextBags };
      }
      if (action.type === "choose") {
        const m = p.mapping as Record<string, string>;
        if (!m || typeof m !== "object") return null;
        const vals = Object.values(m);
        if (vals.length !== 3) return null;
        if (new Set(vals).size !== 3) return null;
        for (const v of vals) if (!["kiss", "marry", "avoid"].includes(v)) return null;
        return { gameState: { ...s, choices: { ...(s.choices as object || {}), [actorPid]: m } }, bags };
      }
      if (action.type === "next") {
        return { gameState: { ...s, turnIndex: (((s.turnIndex as number) || 0) + 1) % n, options: null, choices: {} }, bags };
      }
      return null;
    }
    case "fictionary": {
      // Reader is the current-turn player. They draw the word and read it aloud;
      // everyone else submits a fake definition.
      const reader = room.players[((s.turnIndex as number) || 0) % n];
      if (action.type === "draw") {
        const word = p.word as { word?: string; definition?: string } | undefined;
        if (!word?.word || !word.definition) return null;
        const nextBags = recordDrawn(bags, p.poolKey as string, p.index as number, p.poolSize as number);
        return {
          gameState: { ...s, word: { word: String(word.word), definition: String(word.definition) }, submissions: {}, phase: "submit", order: null, votes: {} },
          bags: nextBags,
        };
      }
      if (action.type === "submit") {
        if (actorPid === reader.id) return null;
        const text = String(p.definition || "").slice(0, 200).trim();
        if (!text) return null;
        return { gameState: { ...s, submissions: { ...(s.submissions as object || {}), [actorPid]: text } }, bags };
      }
      if (action.type === "reveal") {
        const subs = (s.submissions as Record<string, string>) || {};
        const word = s.word as { word: string; definition: string } | null;
        if (!word) return null;
        // Fisher–Yates on [real, ...submissions]
        const pool: Array<{ text: string; authorPid: string | "real" }> = [
          { text: word.definition, authorPid: "real" },
          ...Object.entries(subs).map(([pid, text]) => ({ text, authorPid: pid })),
        ];
        for (let i = pool.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        return { gameState: { ...s, phase: "vote", order: pool, votes: {} }, bags };
      }
      if (action.type === "vote") {
        if (actorPid === reader.id) return null;
        const idx = p.index as number;
        const order = s.order as Array<{ authorPid: string }> | null;
        if (!order || typeof idx !== "number" || idx < 0 || idx >= order.length) return null;
        if (order[idx].authorPid === actorPid) return null; // can't vote for yourself
        return { gameState: { ...s, votes: { ...(s.votes as object || {}), [actorPid]: idx } }, bags };
      }
      if (action.type === "tally") {
        return { gameState: { ...s, phase: "reveal" }, bags };
      }
      if (action.type === "next") {
        return {
          gameState: { ...s, turnIndex: (((s.turnIndex as number) || 0) + 1) % n, word: null, submissions: {}, phase: "idle", order: null, votes: {} },
          bags,
        };
      }
      return null;
    }
    case "five-second": {
      // `draw` locks to the current player — nobody draws for them.
      const current = room.players[((s.turnIndex as number) || 0) % n];
      if (action.type === "draw") {
        if (actorPid !== current.id) return null;
        const nextBags = recordDrawn(bags, p.poolKey as string, p.index as number, p.poolSize as number);
        return {
          gameState: { ...s, prompt: String(p.prompt || ""), startedAt: Date.now(), outcome: null },
          bags: nextBags,
        };
      }
      if (action.type === "judge") {
        const outcome = p.outcome as string;
        if (!["pass", "fail"].includes(outcome)) return null;
        return { gameState: { ...s, outcome }, bags };
      }
      if (action.type === "next") {
        return { gameState: { ...s, turnIndex: (((s.turnIndex as number) || 0) + 1) % n, prompt: null, startedAt: null, outcome: null }, bags };
      }
      return null;
    }
    case "forbidden-phrases": {
      // Current player talks about the topic without saying either taboo word.
      const speaker = room.players[((s.turnIndex as number) || 0) % n];
      if (action.type === "draw") {
        if (actorPid !== speaker.id) return null;
        const forbiddenArr = p.forbidden as unknown[];
        if (!Array.isArray(forbiddenArr) || forbiddenArr.length !== 2) return null;
        const nextBagsA = recordDrawn(bags, p.topicPoolKey as string, p.topicIndex as number, p.topicPoolSize as number);
        const nextBagsB = recordDrawn(nextBagsA, p.forbiddenPoolKey as string, p.forbiddenIndex as number, p.forbiddenPoolSize as number);
        return {
          gameState: {
            ...s,
            prompt: String(p.topic || ""),
            forbidden: [String(forbiddenArr[0]), String(forbiddenArr[1])],
            startedAt: Date.now(),
            outcome: null,
          },
          bags: nextBagsB,
        };
      }
      if (action.type === "judge") {
        const outcome = p.outcome as string;
        if (!["caught", "survived"].includes(outcome)) return null;
        return { gameState: { ...s, outcome }, bags };
      }
      if (action.type === "next") {
        return {
          gameState: { ...s, turnIndex: (((s.turnIndex as number) || 0) + 1) % n, prompt: null, forbidden: null, startedAt: null, outcome: null },
          bags,
        };
      }
      return null;
    }
    case "cheers-to-the-governor": {
      // Current player says the next number. On 21, they earn a new rule slot.
      const caller = room.players[((s.turnIndex as number) || 0) % n];
      if (action.type === "seedRules") {
        // Host or any player applies the starter rule pack on new game.
        const rules = p.rules as Record<string, string> | undefined;
        if (!rules || typeof rules !== "object") return null;
        return { gameState: { ...s, rules }, bags };
      }
      if (action.type === "tick") {
        // Caller advances the count by 1.
        if (actorPid !== caller.id) return null;
        const current = (s.count as number) || 0;
        if (current >= 21) return null;
        const next = current + 1;
        if (next === 21) {
          return { gameState: { ...s, count: 21, pendingRule: true, turnIndex: (((s.turnIndex as number) || 0) + 1) % n }, bags };
        }
        return { gameState: { ...s, count: next, turnIndex: (((s.turnIndex as number) || 0) + 1) % n }, bags };
      }
      if (action.type === "addRule") {
        // Whoever hit 21 picks a number and rule, then count resets to 0.
        if (!s.pendingRule) return null;
        const num = p.number as number;
        const rule = String(p.rule || "").slice(0, 200).trim();
        if (!rule || typeof num !== "number" || num < 1 || num > 21) return null;
        const rules = { ...((s.rules as Record<string, string>) || {}) };
        rules[String(num)] = rule;
        return { gameState: { ...s, rules, pendingRule: false, count: 0, reached21: ((s.reached21 as number) || 0) + 1 }, bags };
      }
      if (action.type === "skipRule") {
        // Optional: 21-reacher declines to add a rule this round.
        if (!s.pendingRule) return null;
        return { gameState: { ...s, pendingRule: false, count: 0, reached21: ((s.reached21 as number) || 0) + 1 }, bags };
      }
      if (action.type === "mistake") {
        // Somebody broke a rule → reset count, keep rules.
        return { gameState: { ...s, count: 0, pendingRule: false }, bags };
      }
      return null;
    }
    case "psychologist": {
      // Any non-psychologist can draw a rule. Rule text sits in state but the
      // client hides it from the current psychologist.
      const psychologist = room.players[((s.psychologistIndex as number) || 0) % n];
      if (action.type === "draw") {
        if (actorPid === psychologist.id) return null;
        const nextBags = recordDrawn(bags, p.poolKey as string, p.index as number, p.poolSize as number);
        return { gameState: { ...s, rule: String(p.rule || ""), phase: "playing" }, bags: nextBags };
      }
      if (action.type === "reveal") {
        return { gameState: { ...s, phase: "reveal" }, bags };
      }
      if (action.type === "next") {
        return {
          gameState: { ...s, psychologistIndex: (((s.psychologistIndex as number) || 0) + 1) % n, rule: null, phase: "idle" },
          bags,
        };
      }
      return null;
    }
    case "alphabet-story": {
      const writer = room.players[((s.letterIndex as number) || 0) % n];
      if (action.type === "setTopic") {
        const nextBags = recordDrawn(bags, p.poolKey as string, p.index as number, p.poolSize as number);
        return { gameState: { ...s, topic: String(p.topic || "") }, bags: nextBags };
      }
      if (action.type === "add") {
        if (actorPid !== writer.id) return null;
        const text = String(p.text || "").slice(0, 240).trim();
        if (!text) return null;
        const letter = String.fromCharCode(65 + (((s.letterIndex as number) || 0) % 26));
        // Light hint: enforce first non-space character matches expected letter.
        if (text.charAt(0).toUpperCase() !== letter) return null;
        const sentences = Array.isArray(s.sentences) ? [...s.sentences] : [];
        sentences.push({ authorPid: actorPid, text, letter });
        return { gameState: { ...s, sentences, letterIndex: ((s.letterIndex as number) || 0) + 1 }, bags };
      }
      if (action.type === "reset") {
        return { gameState: { ...s, letterIndex: 0, sentences: [] }, bags };
      }
      return null;
    }
    case "ghost": {
      // No word validation (would need a dictionary). Instead, trust the group
      // to call out completions manually; anyone can tap "gave a letter".
      const current = room.players[((s.turnIndex as number) || 0) % n];
      if (action.type === "addLetter") {
        if (actorPid !== current.id) return null;
        const letter = String(p.letter || "").toUpperCase();
        if (!/^[A-Z]$/.test(letter)) return null;
        return { gameState: { ...s, letters: String(s.letters || "") + letter, turnIndex: (((s.turnIndex as number) || 0) + 1) % n }, bags };
      }
      if (action.type === "giveGhost") {
        // Someone gets a GHOST letter (ran out of ideas OR completed a word).
        const target = p.playerId as string;
        if (!target || !room.players.some((pl) => pl.id === target)) return null;
        const score = { ...((s.score as Record<string, number>) || {}) };
        const next = Math.min(5, (score[target] || 0) + 1);
        score[target] = next;
        const out = Array.isArray(s.out) ? [...(s.out as string[])] : [];
        if (next === 5 && !out.includes(target)) out.push(target);
        return { gameState: { ...s, score, out, letters: "" }, bags };
      }
      if (action.type === "resetRound") {
        return { gameState: { ...s, letters: "" }, bags };
      }
      return null;
    }
    case "name-game": {
      const current = room.players[((s.turnIndex as number) || 0) % n];
      if (action.type === "addName") {
        if (actorPid !== current.id) return null;
        const name = String(p.name || "").slice(0, 60).trim();
        if (!name) return null;
        const chain = Array.isArray(s.chain) ? [...(s.chain as Array<{ authorPid: string; name: string }>)] : [];
        chain.push({ authorPid: actorPid, name });
        return { gameState: { ...s, chain, turnIndex: (((s.turnIndex as number) || 0) + 1) % n }, bags };
      }
      if (action.type === "giveUp") {
        if (actorPid !== current.id) return null;
        return { gameState: { ...s, turnIndex: (((s.turnIndex as number) || 0) + 1) % n }, bags };
      }
      if (action.type === "reset") {
        return { gameState: { ...s, chain: [] }, bags };
      }
      return null;
    }
    case "rapid-fire": {
      // Victim draws a round's worth of prompts (5 at once), timer runs,
      // self-reports survived/drank at the end.
      const victim = room.players[((s.victimIndex as number) || 0) % n];
      if (action.type === "start") {
        if (actorPid !== victim.id) return null;
        const prompts = p.prompts as unknown[];
        if (!Array.isArray(prompts) || prompts.length === 0) return null;
        const nextBags = recordDrawn(bags, p.poolKey as string, p.index as number, p.poolSize as number);
        return {
          gameState: { ...s, prompts: prompts.map(String), startedAt: Date.now(), outcome: null },
          bags: nextBags,
        };
      }
      if (action.type === "judge") {
        const outcome = p.outcome as string;
        if (!["survived", "drank"].includes(outcome)) return null;
        return { gameState: { ...s, outcome }, bags };
      }
      if (action.type === "next") {
        return { gameState: { ...s, victimIndex: (((s.victimIndex as number) || 0) + 1) % n, prompts: null, startedAt: null, outcome: null }, bags };
      }
      return null;
    }
    case "press-conference": {
      const subject = room.players[((s.subjectIndex as number) || 0) % n];
      if (action.type === "draw") {
        if (actorPid === subject.id) return null;
        const nextBags = recordDrawn(bags, p.poolKey as string, p.index as number, p.poolSize as number);
        return { gameState: { ...s, identity: String(p.identity || ""), phase: "playing" }, bags: nextBags };
      }
      if (action.type === "reveal") return { gameState: { ...s, phase: "reveal" }, bags };
      if (action.type === "next") {
        return { gameState: { ...s, subjectIndex: (((s.subjectIndex as number) || 0) + 1) % n, identity: null, phase: "idle" }, bags };
      }
      return null;
    }
    case "hows-yours": {
      const guesser = room.players[((s.guesserIndex as number) || 0) % n];
      if (action.type === "draw") {
        if (actorPid === guesser.id) return null;
        const nextBags = recordDrawn(bags, p.poolKey as string, p.index as number, p.poolSize as number);
        return { gameState: { ...s, topic: String(p.topic || ""), phase: "playing" }, bags: nextBags };
      }
      if (action.type === "reveal") return { gameState: { ...s, phase: "reveal" }, bags };
      if (action.type === "next") {
        return { gameState: { ...s, guesserIndex: (((s.guesserIndex as number) || 0) + 1) % n, topic: null, phase: "idle" }, bags };
      }
      return null;
    }
    case "sorry-im-late": {
      const late = room.players[((s.lateIndex as number) || 0) % n];
      if (action.type === "draw") {
        if (actorPid === late.id) return null;
        const nextBags = recordDrawn(bags, p.poolKey as string, p.index as number, p.poolSize as number);
        return { gameState: { ...s, reason: String(p.reason || ""), phase: "playing" }, bags: nextBags };
      }
      if (action.type === "reveal") return { gameState: { ...s, phase: "reveal" }, bags };
      if (action.type === "next") {
        return { gameState: { ...s, lateIndex: (((s.lateIndex as number) || 0) + 1) % n, reason: null, phase: "idle" }, bags };
      }
      return null;
    }
    case "the-jar": {
      if (action.type === "submit") {
        if (s.phase !== "submit") return null;
        const text = String(p.text || "").slice(0, 220).trim();
        if (!text) return null;
        return {
          gameState: { ...s, submissions: { ...(s.submissions as object || {}), [actorPid]: text } },
          bags,
        };
      }
      if (action.type === "startReading") {
        if (s.phase !== "submit") return null;
        const subs = (s.submissions as Record<string, string>) || {};
        const entries = Object.entries(subs).map(([pid, text]) => ({ authorPid: pid, text }));
        if (entries.length < 2) return null;
        for (let i = entries.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [entries[i], entries[j]] = [entries[j], entries[i]];
        }
        return { gameState: { ...s, phase: "reading", order: entries, readIndex: 0, votes: {}, revealed: false }, bags };
      }
      if (action.type === "vote") {
        if (s.phase !== "reading") return null;
        const guessed = p.playerId as string;
        if (!guessed || !room.players.some((pl) => pl.id === guessed)) return null;
        const readIdx = String((s.readIndex as number) || 0);
        const allVotes = { ...((s.votes as Record<string, Record<string, string>>) || {}) };
        const perRead = { ...(allVotes[readIdx] || {}) };
        perRead[actorPid] = guessed;
        allVotes[readIdx] = perRead;
        return { gameState: { ...s, votes: allVotes }, bags };
      }
      if (action.type === "revealOne") {
        if (s.phase !== "reading") return null;
        return { gameState: { ...s, revealed: true }, bags };
      }
      if (action.type === "nextConfession") {
        if (s.phase !== "reading") return null;
        const order = s.order as Array<{ authorPid: string; text: string }> | null;
        if (!order) return null;
        const nextIdx = ((s.readIndex as number) || 0) + 1;
        if (nextIdx >= order.length) {
          return { gameState: { ...s, phase: "done", revealed: true }, bags };
        }
        return { gameState: { ...s, readIndex: nextIdx, revealed: false }, bags };
      }
      if (action.type === "reset") {
        return {
          gameState: { phase: "submit", submissions: {}, order: null, readIndex: 0, votes: {}, revealed: false },
          bags,
        };
      }
      return null;
    }
    case "say-the-same-thing": {
      const pairIdx = (s.pairIndex as number) || 0;
      const a = room.players[(pairIdx * 2) % n];
      const b = room.players[(pairIdx * 2 + 1) % n];
      const amA = actorPid === a.id;
      const amB = actorPid === b.id && a.id !== b.id;
      if (action.type === "submit") {
        if (!amA && !amB) return null;
        const word = String(p.word || "").slice(0, 40).trim();
        if (!word) return null;
        const subs = { ...((s.submissions as Record<string, string>) || {}) };
        subs[actorPid] = word;
        // If both players submitted, advance phase to reveal.
        const bothIn = subs[a.id] && subs[b.id] && a.id !== b.id;
        return { gameState: { ...s, submissions: subs, phase: bothIn ? "reveal" : "submit" }, bags };
      }
      if (action.type === "tally") {
        if (s.phase !== "reveal") return null;
        const subs = (s.submissions as Record<string, string>) || {};
        const wa = (subs[a.id] || "").toLowerCase();
        const wb = (subs[b.id] || "").toLowerCase();
        const matched = wa && wa === wb;
        const history = Array.isArray(s.history) ? [...(s.history as Array<{ a: { pid: string; word: string }; b: { pid: string; word: string } }>)] : [];
        history.push({ a: { pid: a.id, word: subs[a.id] || "" }, b: { pid: b.id, word: subs[b.id] || "" } });
        return {
          gameState: { ...s, history, submissions: {}, phase: matched ? "won" : "submit" },
          bags,
        };
      }
      if (action.type === "giveUp") {
        return { gameState: { ...s, submissions: {}, history: [], phase: "submit", pairIndex: (pairIdx + 1) % Math.max(1, Math.floor(n / 2)) }, bags };
      }
      if (action.type === "nextPair") {
        return { gameState: { ...s, submissions: {}, history: [], phase: "submit", pairIndex: (pairIdx + 1) % Math.max(1, Math.floor(n / 2)) }, bags };
      }
      return null;
    }
  }
  return null;
}
