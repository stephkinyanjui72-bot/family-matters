export type Intensity = "mild" | "spicy" | "extreme" | "chaos";

export type GameId =
  | "truth-or-dare"
  | "do-or-drink"
  | "never-have-i-ever"
  | "most-likely-to"
  | "would-you-rather"
  | "paranoia"
  | "spin-the-bottle"
  | "two-truths-and-a-lie"
  | "hot-seat"
  | "kiss-marry-avoid"
  | "fictionary"
  | "five-second"
  | "forbidden-phrases"
  | "cheers-to-the-governor"
  | "psychologist"
  | "alphabet-story"
  | "ghost"
  | "name-game"
  | "rapid-fire"
  | "press-conference"
  | "hows-yours"
  | "sorry-im-late"
  | "the-jar"
  | "say-the-same-thing"
  | "mafia"
  | "psychic"
  | "the-imposter";

export interface Player {
  id: string;          // stable pid, survives reconnect
  name: string;
  isHost: boolean;
  online: boolean;
}

export interface Room {
  code: string;
  hostId: string;
  intensity: Intensity;
  players: Player[];
  currentGame: GameId | null;
  gameState: unknown;
  bags: Record<string, number[]>;
  createdAt: number;
}
