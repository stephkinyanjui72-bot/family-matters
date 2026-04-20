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
      if (action.type === "pick") {
        if (actorPid !== currentByTurn().id && !isHost) return null;
        if (!["truth", "dare"].includes(p.kind as string)) return null;
        const nextBags = recordDrawn(bags, p.poolKey as string, p.index as number, p.poolSize as number);
        return { gameState: { ...s, pick: p.kind, prompt: String(p.prompt || "") }, bags: nextBags };
      }
      if (action.type === "next" && isHost) {
        return { gameState: { ...s, turnIndex: (((s.turnIndex as number) || 0) + 1) % n, pick: null, prompt: null }, bags };
      }
      return null;
    }
    case "do-or-drink": {
      if (action.type === "reveal" && isHost) {
        const nextBags = recordDrawn(bags, p.poolKey as string, p.index as number, p.poolSize as number);
        return { gameState: { ...s, challenge: String(p.challenge || "") }, bags: nextBags };
      }
      if (action.type === "next" && isHost) {
        return { gameState: { ...s, turnIndex: (((s.turnIndex as number) || 0) + 1) % n, challenge: null }, bags };
      }
      return null;
    }
    case "never-have-i-ever": {
      if (action.type === "reveal" && isHost) {
        const nextBags = recordDrawn(bags, p.poolKey as string, p.index as number, p.poolSize as number);
        return { gameState: { ...s, prompt: String(p.prompt || "") }, bags: nextBags };
      }
      if (action.type === "next" && isHost) {
        return { gameState: { ...s, turnIndex: (((s.turnIndex as number) || 0) + 1) % n, prompt: null }, bags };
      }
      return null;
    }
    case "most-likely-to": {
      if (action.type === "reveal" && isHost) {
        const nextBags = recordDrawn(bags, p.poolKey as string, p.index as number, p.poolSize as number);
        return { gameState: { ...s, prompt: String(p.prompt || ""), votes: {}, revealed: false }, bags: nextBags };
      }
      if (action.type === "vote") {
        const target = p.playerId as string;
        if (!target || !room.players.some((pl) => pl.id === target)) return null;
        return { gameState: { ...s, votes: { ...(s.votes as object || {}), [actorPid]: target } }, bags };
      }
      if (action.type === "tally" && isHost) return { gameState: { ...s, revealed: true }, bags };
      if (action.type === "next" && isHost) return { gameState: { ...s, prompt: null, votes: {}, revealed: false }, bags };
      return null;
    }
    case "would-you-rather": {
      if (action.type === "reveal" && isHost) {
        const nextBags = recordDrawn(bags, p.poolKey as string, p.index as number, p.poolSize as number);
        return { gameState: { ...s, prompt: p.prompt ?? null, votes: {}, revealed: false }, bags: nextBags };
      }
      if (action.type === "vote") {
        if (!["a", "b"].includes(p.choice as string)) return null;
        return { gameState: { ...s, votes: { ...(s.votes as object || {}), [actorPid]: p.choice } }, bags };
      }
      if (action.type === "tally" && isHost) return { gameState: { ...s, revealed: true }, bags };
      if (action.type === "next" && isHost) return { gameState: { ...s, prompt: null, votes: {}, revealed: false }, bags };
      return null;
    }
    case "paranoia": {
      const asker = room.players[((s.askerIndex as number) || 0) % n];
      if (action.type === "ask") {
        if (actorPid !== asker.id) return null;
        const tid = p.targetId as string;
        if (!tid || tid === asker.id || !room.players.some((pl) => pl.id === tid)) return null;
        const nextBags = recordDrawn(bags, p.poolKey as string, p.index as number, p.poolSize as number);
        return { gameState: { ...s, prompt: String(p.prompt || ""), targetId: tid, revealed: false }, bags: nextBags };
      }
      if (action.type === "flipCoin" && isHost) return { gameState: { ...s, revealed: !!p.revealed }, bags };
      if (action.type === "next" && isHost) {
        return { gameState: { ...s, askerIndex: (((s.askerIndex as number) || 0) + 1) % n, prompt: null, targetId: null, revealed: false }, bags };
      }
      return null;
    }
    case "spin-the-bottle": {
      if (action.type === "spin" && isHost) {
        const picker = Math.floor(Math.random() * n);
        let target = Math.floor(Math.random() * n);
        if (n > 1) while (target === picker) target = Math.floor(Math.random() * n);
        return { gameState: { spinning: true, pickerIndex: picker, targetIndex: target, seed: Date.now() }, bags };
      }
      if (action.type === "settle" && isHost) return { gameState: { ...s, spinning: false }, bags };
      return null;
    }
    case "two-truths-and-a-lie": {
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
      if (action.type === "reveal" && isHost) {
        const statements = s.statements as Array<{ isLie: boolean }> | null;
        const idx = statements?.findIndex((x) => x.isLie) ?? -1;
        if (idx < 0) return null;
        return { gameState: { ...s, revealedLie: idx }, bags };
      }
      if (action.type === "next" && isHost) {
        return { gameState: { ...s, turnIndex: (((s.turnIndex as number) || 0) + 1) % n, statements: null, votes: {}, revealedLie: null }, bags };
      }
      return null;
    }
    case "hot-seat": {
      if (action.type === "reveal" && isHost) {
        const nextBags = recordDrawn(bags, p.poolKey as string, p.index as number, p.poolSize as number);
        return { gameState: { ...s, prompt: String(p.prompt || "") }, bags: nextBags };
      }
      if (action.type === "nextVictim" && isHost) {
        return { gameState: { ...s, victimIndex: (((s.victimIndex as number) || 0) + 1) % n, prompt: null }, bags };
      }
      return null;
    }
    case "kiss-marry-avoid": {
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
      if (action.type === "next" && isHost) {
        return { gameState: { ...s, turnIndex: (((s.turnIndex as number) || 0) + 1) % n, options: null, choices: {} }, bags };
      }
      return null;
    }
  }
  return null;
}
