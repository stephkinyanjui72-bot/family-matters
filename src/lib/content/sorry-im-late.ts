import type { Intensity } from "../types";

// The reason the "late one" is late — shown to everyone EXCEPT them. They
// improvise an explanation while the group asks leading questions designed
// to make them land on this reason.

export const reasons: Record<Intensity, string[]> = {
  mild: [
    "a pigeon flew into your apartment and refused to leave",
    "you got stuck in a wedding you weren't invited to",
    "your Uber driver was a childhood bully",
    "you accidentally joined a cult for forty minutes",
    "you had to deliver a baby in an elevator",
    "you got chased by a goose through three neighborhoods",
    "a celebrity mistook you for their ex",
    "you got arrested for jaywalking by a mall cop",
    "your GPS led you to an alligator sanctuary",
    "a film crew made you be an extra for an hour",
    "you accidentally bought a goat",
    "you were on live TV by mistake",
  ],
  spicy: [
    "you got accidentally engaged to a stranger",
    "you had to break up with your Hinge match in person",
    "you hooked up with your therapist's other client",
    "your one-night stand turned into a dinner party",
    "you got catfished by a dating-app bot that was actually hot",
    "you slept with a bartender and had to close the bar",
    "you accidentally attended your ex's wedding as a plus one",
    "you got stuck on a date you thought was a job interview",
    "you matched with someone who turned out to be your boss",
    "you had to tell someone their crush is your ex",
    "your blind date was a friend of your mother's",
    "you took a cold shower at a stranger's house at 6am",
  ],
  extreme: [
    "you accidentally started a threesome with your neighbors",
    "your hookup locked you out naked",
    "you woke up in the wrong city with handcuffs still on",
    "you helped a dominatrix move apartments",
    "you were seduced by someone who turned out to be married",
    "you broke a bed belonging to someone famous",
    "you got stuck in a sex dungeon during a power outage",
    "you survived a threesome with two exes who still hate each other",
    "you fell asleep at an orgy and had to sneak out",
    "you accidentally ordered a stripper to your boss's house",
    "you had to drive your Uber driver home after a mutual hookup",
    "your partner's parents walked in on you mid-act",
  ],
  chaos: [
    "you attended a séance and accidentally got possessed by a horny ghost",
    "you hooked up with three cast members of the same reality show",
    "you were abducted by an AI girlfriend and had to talk your way out",
    "you were the surprise performer at a stag party",
    "you accidentally proposed to a robot",
    "you fell in love with a sex-tape editor in one weekend",
    "you were the last-minute replacement at a cuckold wedding",
    "you got bitten by a vampire mid-hookup",
    "you were kidnapped by a cult that wanted you for a ritual orgy",
    "a time traveler invited you to the best threesome of 1987",
    "you fell out of a second-story window in fishnets",
    "you married your Uber driver at a drive-thru chapel",
  ],
};
