import type { Intensity } from "../types";

export interface WYR {
  a: string;
  b: string;
}

export const prompts: Record<Intensity, WYR[]> = {
  mild: [
    { a: "Have no internet for a month", b: "Have no phone for a month" },
    { a: "Always be 10 minutes late", b: "Always be 20 minutes early" },
    { a: "Know when you'll die", b: "Know how you'll die" },
    { a: "Be able to fly but slowly", b: "Be invisible but only at night" },
    { a: "Never be able to lie again", b: "Never be able to tell the truth again" },
    { a: "Live without music", b: "Live without movies" },
    { a: "Be famous but broke", b: "Be rich but unknown" },
  ],
  spicy: [
    { a: "Get caught watching something filthy", b: "Get caught reading someone's DMs" },
    { a: "Hook up with your celebrity crush once", b: "Date your regular crush for a year" },
    { a: "Have your ex read your diary", b: "Have your mom read your DMs" },
    { a: "Kiss everyone in this room", b: "Confess your biggest crush here" },
    { a: "Only hook up with lights on", b: "Only hook up in total silence" },
    { a: "Date someone 20 years older", b: "Date someone who earns 10x less than you" },
    { a: "Be bad in bed but great at flirting", b: "Be great in bed but terrible at flirting" },
  ],
  chaos: [
    { a: "Be the dom every time forever", b: "Be the sub every time forever" },
    { a: "Let the group design your next date outfit", b: "Let them write the first message you send your crush" },
    { a: "Kiss everyone in this room once", b: "Kiss one person here for a full 2 minutes" },
    { a: "Have your filthiest voice note played in a family group chat", b: "Have your dirtiest DM screenshot shown on a billboard for a day" },
    { a: "Only hook up in public places", b: "Only hook up while being filmed" },
    { a: "Have your partner read everyone you've ever been with out loud", b: "Read theirs out loud to the group" },
    { a: "Sleep with your celebrity crush once and forget it", b: "Remember every detail of every hookup forever" },
    { a: "Tell your ex you still think about them", b: "Tell your current crush every detail of what you'd do to them" },
    { a: "Be great but completely silent", b: "Be very loud but mediocre" },
    { a: "Hook up with the last person you DM'd", b: "Hook up with the last person who DM'd you" },
  ],
  extreme: [
    { a: "Hook up with your best friend's ex", b: "Your best friend hook up with your ex" },
    { a: "Have your browser history leaked", b: "Have your camera roll leaked" },
    { a: "Sleep with someone in this room", b: "Sleep with someone your best friend chooses" },
    { a: "Be tied up and unable to move", b: "Do the tying and fully in control" },
    { a: "Always finish in 30 seconds", b: "Never finish at all" },
    { a: "Sleep with the same person forever", b: "Sleep with someone new every week" },
    { a: "Have everyone here see your filthiest text", b: "Read yours out loud now" },
  ],
};
