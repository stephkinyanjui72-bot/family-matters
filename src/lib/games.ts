import type { GameId } from "./types";

export interface GameMeta {
  id: GameId;
  name: string;
  blurb: string;
  emoji: string;
  minPlayers: number;
}

export const GAMES: GameMeta[] = [
  { id: "truth-or-dare", name: "Truth or Dare", blurb: "Spill secrets or pay the price.", emoji: "🎯", minPlayers: 2 },
  { id: "do-or-drink", name: "Do or Drink", blurb: "Take the challenge or take a shot.", emoji: "🥃", minPlayers: 2 },
  { id: "never-have-i-ever", name: "Never Have I Ever", blurb: "Put fingers down. No lies.", emoji: "✋", minPlayers: 3 },
  { id: "most-likely-to", name: "Most Likely To", blurb: "Vote on who would actually do it.", emoji: "🫵", minPlayers: 3 },
  { id: "would-you-rather", name: "Would You Rather", blurb: "Impossible choices only.", emoji: "⚖️", minPlayers: 2 },
  { id: "paranoia", name: "Paranoia", blurb: "Whisper the question. Name a name.", emoji: "🤫", minPlayers: 3 },
  { id: "spin-the-bottle", name: "Spin the Bottle", blurb: "Classic chaos, digital spin.", emoji: "🍾", minPlayers: 3 },
  { id: "two-truths-and-a-lie", name: "Two Truths & a Lie", blurb: "Guess which one is fiction.", emoji: "🕵️", minPlayers: 3 },
  { id: "hot-seat", name: "Hot Seat", blurb: "Rapid-fire questions. One victim.", emoji: "🔥", minPlayers: 3 },
  { id: "kiss-marry-avoid", name: "Kiss / Marry / Avoid", blurb: "Three names. Pick a fate.", emoji: "💋", minPlayers: 2 },
  { id: "fictionary", name: "Fictionary", blurb: "Bluff a fake definition. Catch the real one.", emoji: "📖", minPlayers: 3 },
  { id: "five-second", name: "5 Second Game", blurb: "Name 3 things in 5 seconds. Go.", emoji: "⏱️", minPlayers: 2 },
  { id: "forbidden-phrases", name: "Forbidden Phrases", blurb: "Answer without saying the taboo words.", emoji: "🤐", minPlayers: 3 },
  { id: "cheers-to-the-governor", name: "Cheers to the Governor", blurb: "Count to 21. Make a rule. Repeat.", emoji: "🍻", minPlayers: 3 },
  { id: "psychologist", name: "Psychologist", blurb: "Crack the group's secret rule.", emoji: "🛋️", minPlayers: 4 },
  { id: "alphabet-story", name: "Alphabet Story", blurb: "A to Z, one sentence each.", emoji: "✏️", minPlayers: 3 },
  { id: "ghost", name: "Ghost", blurb: "Add a letter. Don't complete a word.", emoji: "👻", minPlayers: 3 },
  { id: "name-game", name: "The Name Game", blurb: "Celebrity chain. Fail = drink.", emoji: "🎬", minPlayers: 3 },
  { id: "rapid-fire", name: "Rapid Fire", blurb: "Hot seat. 30 seconds of questions.", emoji: "🔫", minPlayers: 3 },
];

export const GAMES_BY_ID: Record<GameId, GameMeta> = Object.fromEntries(
  GAMES.map((g) => [g.id, g])
) as Record<GameId, GameMeta>;
