import type { Intensity } from "../types";

// Optional story topics to set the vibe. The alphabet rule (A-Z turn order)
// does most of the work — the topic just frames the mood.

export const topics: Record<Intensity, string[]> = {
  mild: [
    "a disastrous family reunion",
    "a first day at a weird new job",
    "a haunted road trip",
    "a cooking show gone wrong",
    "a last-minute wedding disaster",
    "a talking dog's autobiography",
    "a secret agent on vacation",
    "a reality TV show nobody wanted",
    "an Uber ride from hell",
    "a zombie apocalypse at a high school reunion",
  ],
  spicy: [
    "a drunken night that ended in a tattoo",
    "a Vegas weekend that got out of hand",
    "an accidental threesome with someone's ex",
    "a yoga retreat that turned into a sex cult",
    "a hot stranger on a cross-country train",
    "a bachelorette party that crossed the line",
    "two coworkers stuck in a hotel during a blizzard",
    "a blind date that became a hookup",
    "a wedding where someone slept with the priest",
    "a flight attendant with a secret double life",
  ],
  extreme: [
    "a brothel's weirdest night",
    "a stripper whose pole breaks mid-performance",
    "a sex tape leak at a corporate retreat",
    "an orgy at the wrong address",
    "a dominatrix who falls for her client",
    "a porn star's first day on set",
    "a sugar baby who becomes the mom",
    "a couple who records their first threesome",
    "a monk who breaks every vow in 24 hours",
    "a stag night that turns into a crime scene",
  ],
  chaos: [
    "a deity with daddy issues",
    "a demon's first Grindr date",
    "a secret underground BDSM church",
    "a group chat that accidentally invites the ex",
    "an AI that learns sex from 4chan",
    "a reality show where the rose means something else",
    "a cult where everyone is legally married to a pineapple",
    "a porn set crashed by a mother-in-law",
    "a failing nightclub saved by a drag messiah",
    "a vampire who only feeds on orgasms",
  ],
};
