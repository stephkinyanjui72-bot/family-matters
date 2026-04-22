import type { GameId } from "./types";

export type Category = "spill" | "sleuth" | "quick" | "play" | "mingle";

export interface GameMeta {
  id: GameId;
  name: string;
  blurb: string;
  emoji: string;
  minPlayers: number;
  category: Category;
  // When false, hidden entirely from under-18 accounts (the game is
  // inherently adult: drinking-centric, kissing-centric, or confession-
  // laden). Under-18 users never see these in the grid or filter counts.
  minorSafe: boolean;
}

export interface CategoryMeta {
  id: Category;
  label: string;
  emoji: string;
  // Two-color gradient used for tile accents + filter chip.
  tone: [string, string]; // tailwind color class segments, e.g. "from-flame" "to-ember"
  ring: string;           // ring color class used for selected state
}

export const CATEGORIES: CategoryMeta[] = [
  { id: "spill",  label: "Spill",  emoji: "💋", tone: ["from-flame",     "to-ember"],     ring: "ring-flame/60" },
  { id: "sleuth", label: "Sleuth", emoji: "🕵️", tone: ["from-neon",      "to-cyber"],     ring: "ring-neon/60" },
  { id: "quick",  label: "Quick",  emoji: "⚡",  tone: ["from-ember",     "to-yellow-400"],ring: "ring-ember/60" },
  { id: "play",   label: "Play",   emoji: "🎭", tone: ["from-cyber",     "to-emerald-400"],ring: "ring-cyber/60" },
  { id: "mingle", label: "Mingle", emoji: "💘", tone: ["from-rose-600",  "to-flame"],     ring: "ring-rose-500/60" },
];

export const CATEGORIES_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<Category, CategoryMeta>;

export const GAMES: GameMeta[] = [
  // Mingle — physical contact, kissing, whisper, romantic choice (sits last in the filter row)
  { id: "truth-or-dare",          name: "Truth or Dare",         blurb: "Spill secrets or pay the price.",             emoji: "🎯",  minPlayers: 2, category: "mingle", minorSafe: true },
  { id: "paranoia",               name: "Paranoia",              blurb: "Whisper the question. Name a name.",          emoji: "🤫",  minPlayers: 3, category: "mingle", minorSafe: true },

  // Spill — confessions, reveals, group voting
  { id: "do-or-drink",            name: "Do or Drink",           blurb: "Take the challenge or take a shot.",          emoji: "🥃",  minPlayers: 2, category: "spill",  minorSafe: false },
  { id: "never-have-i-ever",      name: "Never Have I Ever",     blurb: "Put fingers down. No lies.",                  emoji: "✋",  minPlayers: 3, category: "spill",  minorSafe: true },
  { id: "most-likely-to",         name: "Most Likely To",        blurb: "Vote on who would actually do it.",           emoji: "🫵",  minPlayers: 3, category: "spill",  minorSafe: true },
  { id: "would-you-rather",       name: "Would You Rather",      blurb: "Impossible choices only.",                    emoji: "⚖️",  minPlayers: 2, category: "spill",  minorSafe: true },
  { id: "hot-seat",               name: "Hot Seat",              blurb: "Rapid-fire questions. One victim.",           emoji: "🔥",  minPlayers: 3, category: "spill",  minorSafe: true },
  { id: "the-jar",                name: "The Jar",               blurb: "Anonymous confessions. Guess whose.",         emoji: "🏺",  minPlayers: 3, category: "spill",  minorSafe: false },

  // Sleuth — deduction, hidden-info, social bluffing
  { id: "mafia",                  name: "Mafia",                 blurb: "Secret roles. Night kills. Day lynch.",       emoji: "🕴️", minPlayers: 5, category: "sleuth", minorSafe: true },
  { id: "the-imposter",           name: "The Imposter",          blurb: "One player is lost. Sniff them out.",         emoji: "🕵️", minPlayers: 4, category: "sleuth", minorSafe: true },
  { id: "psychologist",           name: "Psychologist",          blurb: "Crack the group's secret rule.",              emoji: "🛋️", minPlayers: 4, category: "sleuth", minorSafe: true },
  { id: "press-conference",       name: "The Press Conference",  blurb: "Answer as a secret identity.",                emoji: "🎤",  minPlayers: 4, category: "sleuth", minorSafe: true },
  { id: "hows-yours",             name: "How's Yours?",          blurb: "Guess the shared topic.",                     emoji: "👀",  minPlayers: 4, category: "sleuth", minorSafe: true },
  { id: "sorry-im-late",          name: "Sorry I'm Late",        blurb: "Improvise your way out of it.",               emoji: "🚪",  minPlayers: 4, category: "sleuth", minorSafe: true },
  { id: "two-truths-and-a-lie",   name: "Two Truths & a Lie",    blurb: "Guess which one is fiction.",                 emoji: "🕵️", minPlayers: 3, category: "sleuth", minorSafe: true },
  { id: "fictionary",             name: "Fictionary",            blurb: "Bluff a fake definition. Catch the real one.",emoji: "📖",  minPlayers: 3, category: "sleuth", minorSafe: true },

  // Quick — timer, reflex, word-chain, rapid voting
  { id: "five-second",            name: "5 Second Game",         blurb: "Name 3 things in 5 seconds. Go.",             emoji: "⏱️",  minPlayers: 2, category: "quick",  minorSafe: true },
  { id: "rapid-fire",             name: "Rapid Fire",            blurb: "Hot seat. 30 seconds of questions.",          emoji: "🔫",  minPlayers: 3, category: "quick",  minorSafe: true },
  { id: "alphabet-game",          name: "The Alphabet Game",     blurb: "A to Z. One category. Miss your letter.",     emoji: "🔤",  minPlayers: 3, category: "quick",  minorSafe: true },
  { id: "ghost",                  name: "Ghost",                 blurb: "Add a letter. Don't complete a word.",        emoji: "👻",  minPlayers: 3, category: "quick",  minorSafe: true },
  { id: "forbidden-phrases",      name: "Forbidden Phrases",     blurb: "Answer without saying the taboo words.",      emoji: "🤐",  minPlayers: 3, category: "quick",  minorSafe: true },
  { id: "say-the-same-thing",     name: "Say The Same Thing",    blurb: "Two minds, one word. Converge.",              emoji: "🧠",  minPlayers: 3, category: "quick",  minorSafe: true },
  { id: "thumbs-up-down",         name: "Thumbs Up, Thumbs Down",blurb: "Would you, or wouldn't you?",                 emoji: "👍",  minPlayers: 3, category: "quick",  minorSafe: true },
  { id: "green-glass-door",       name: "Green Glass Door",      blurb: "Crack the hidden rule.",                      emoji: "🚪",  minPlayers: 3, category: "quick",  minorSafe: true },
  { id: "name-game",              name: "The Name Game",         blurb: "Celebrity chain. Fail = drink.",              emoji: "🎬",  minPlayers: 3, category: "quick",  minorSafe: true },

  // Mingle (continued) — romantic/kissing classics
  { id: "spin-the-bottle",        name: "Spin the Bottle",       blurb: "Classic chaos, digital spin.",                emoji: "🍾",  minPlayers: 3, category: "mingle", minorSafe: false },
  { id: "kiss-marry-avoid",       name: "Kiss / Marry / Avoid",  blurb: "Three names. Pick a fate.",                   emoji: "💋",  minPlayers: 2, category: "mingle", minorSafe: false },

  // Play — perform, random, roleplay
  { id: "reverse-charades",       name: "Reverse Charades",      blurb: "Everyone acts. One guesser.",                 emoji: "🎭",  minPlayers: 4, category: "play",   minorSafe: true },
  { id: "alphabet-story",         name: "Alphabet Story",        blurb: "A to Z, one sentence each.",                  emoji: "✏️",  minPlayers: 3, category: "play",   minorSafe: true },
  { id: "psychic",                name: "Psychic",               blurb: "Read the room's mind.",                       emoji: "🔮",  minPlayers: 4, category: "play",   minorSafe: true },
  { id: "cheers-to-the-governor", name: "Cheers to the Governor",blurb: "Count to 21. Make a rule. Repeat.",           emoji: "🍻",  minPlayers: 3, category: "play",   minorSafe: false },
];

export const GAMES_BY_ID: Record<GameId, GameMeta> = Object.fromEntries(
  GAMES.map((g) => [g.id, g])
) as Record<GameId, GameMeta>;
