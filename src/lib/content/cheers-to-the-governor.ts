import type { Intensity } from "../types";

// Classic Cheers-to-the-Governor suggests a starter set of numbered rules
// that the game adopts by default for each intensity. At number 21, the
// closing player gets to add a new rule of their own.
// The "rule" is a tiny action a player takes when THEIR turn lands on that
// number — e.g. "7 = say 'the queen'".

export interface RuleSeed {
  number: number;
  rule: string;
}

export const starterRules: Record<Intensity, RuleSeed[]> = {
  mild: [
    { number: 7, rule: "Say 'cheers' before saying 7." },
    { number: 12, rule: "Wink at someone before saying 12." },
    { number: 15, rule: "Say a compliment to the person on your left." },
  ],
  spicy: [
    { number: 5, rule: "Blow a kiss to someone else before saying 5." },
    { number: 10, rule: "Say a celebrity you'd kiss before saying 10." },
    { number: 18, rule: "Make eye contact with your crush before saying 18." },
  ],
  extreme: [
    { number: 4, rule: "Name a kink before saying 4." },
    { number: 9, rule: "Touch yourself (anywhere appropriate) before saying 9." },
    { number: 14, rule: "Say 'daddy' or 'mommy' before saying 14." },
    { number: 20, rule: "Bite your lip before saying 20." },
  ],
  chaos: [
    { number: 3, rule: "Say a safe word before saying 3." },
    { number: 8, rule: "Moan before saying 8." },
    { number: 13, rule: "Grab someone's hand before saying 13." },
    { number: 17, rule: "Say 'yes daddy' before saying 17." },
    { number: 19, rule: "Take a sip before saying 19." },
  ],
};
