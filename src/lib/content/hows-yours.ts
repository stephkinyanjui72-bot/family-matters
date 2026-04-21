import type { Intensity } from "../types";

// The group silently agrees on a topic — usually something everyone has or
// does. The guesser asks "How's yours?" to each player and tries to figure
// out what the topic is. Shown to everyone EXCEPT the guesser.

export const topics: Record<Intensity, string[]> = {
  mild: [
    "morning breath",
    "the car you drive",
    "your relationship with your mom",
    "your dance moves",
    "your handwriting",
    "your childhood bedroom",
    "your laundry pile",
    "your Instagram aesthetic",
    "your fridge right now",
    "your haircut",
    "your taste in music",
    "your apartment's water pressure",
  ],
  spicy: [
    "your dating life",
    "your last kiss",
    "your DM inbox",
    "your flirting skills",
    "your ex",
    "your dating-app strategy",
    "your crush",
    "your love life since the breakup",
    "your type",
    "your last date",
  ],
  extreme: [
    "your sex life",
    "your oral skills",
    "your kink list",
    "your body count",
    "your nudes folder",
    "your fantasies",
    "your performance in bed",
    "your safeword",
    "your stamina",
    "your hookup history",
  ],
  chaos: [
    "your cumshot",
    "your sex tape",
    "your OnlyFans",
    "your porn history",
    "your dirtiest hookup",
    "your sex-toy drawer",
    "your kinkiest regret",
    "your group-sex experience",
    "your paid-for sex",
    "your infidelity record",
  ],
};
