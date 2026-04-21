import type { Intensity } from "../types";

// Green Glass Door rules: a hidden pattern that says what "can come through".
// One player (the knower) holds the rule; others propose words; the knower
// judges. The classic examples below use word-pattern tricks.

export interface GreenGlassRule {
  text: string;   // shown on reveal
  hint: string;   // optional short hint / pattern description
  examples?: string[]; // fit examples for the knower's reference
}

export const rules: Record<Intensity, GreenGlassRule[]> = {
  mild: [
    { text: "Must contain a double letter.", hint: "Two of the same letter in a row.", examples: ["bookkeeper", "coffee", "balloon"] },
    { text: "Must start with the same letter it ends with.", hint: "First letter = last letter.", examples: ["tomato", "xerox", "level"] },
    { text: "Must have exactly two syllables.", hint: "Two-beat words only.", examples: ["rabbit", "laptop", "garage"] },
    { text: "Must not contain the letter E.", hint: "No 'E' allowed.", examples: ["pajamas", "tomato", "plant"] },
    { text: "Must be a compound word.", hint: "Two words smushed into one.", examples: ["toothbrush", "backpack", "moonlight"] },
    { text: "Must rhyme with 'tree'.", hint: "Ends with the -ee sound.", examples: ["bee", "knee", "agree"] },
    { text: "Must start with a vowel.", hint: "A, E, I, O, U only.", examples: ["apple", "orange", "umbrella"] },
    { text: "Must be something you can hold in one hand.", hint: "Small enough to carry.", examples: ["phone", "apple", "lighter"] },
  ],
  spicy: [
    { text: "Must be something you'd find in a bedroom.", hint: "Bedroom objects.", examples: ["pillow", "lamp", "mirror"] },
    { text: "Must rhyme with 'date'.", hint: "-ate endings.", examples: ["late", "hate", "mate"] },
    { text: "Must be an item of clothing you wear on a date.", hint: "Date outfit.", examples: ["dress", "cologne", "heels"] },
    { text: "Must contain a silent letter.", hint: "A letter that's written but not said.", examples: ["knife", "write", "psalm"] },
    { text: "Must be something you'd hide from a partner.", hint: "Guilty secret objects.", examples: ["diary", "burner phone", "receipts"] },
    { text: "Must contain the letters of the word LOVE (in order, gaps allowed).", hint: "L…O…V…E scattered inside.", examples: ["lovely", "leftovers", "Lovejoy"] },
    { text: "Must be something that comes in pairs.", hint: "Usually two at once.", examples: ["shoes", "earrings", "lips"] },
  ],
  extreme: [
    { text: "Must be something used during sex.", hint: "Bedroom essentials.", examples: ["lube", "condom", "handcuffs"] },
    { text: "Must rhyme with 'bed'.", hint: "-ed endings.", examples: ["head", "dead", "red"] },
    { text: "Must be a body part below the waist.", hint: "Lower half only.", examples: ["knee", "ankle", "thigh"] },
    { text: "Must contain the letter X.", hint: "X somewhere in the word.", examples: ["sex", "climax", "latex"] },
    { text: "Must be something wet.", hint: "Anything wet.", examples: ["tongue", "rain", "ocean"] },
    { text: "Must be something you do on your knees.", hint: "Kneeling activities.", examples: ["prayer", "proposal", "begging"] },
    { text: "Must be something you'd never text your mom.", hint: "NSFW words.", examples: ["nudes", "kink", "Pornhub"] },
  ],
  chaos: [
    { text: "Must be something that goes in or on a body.", hint: "Enters or wears.", examples: ["tongue", "lipstick", "catheter"] },
    { text: "Must be a kink.", hint: "Listed on a kink chart.", examples: ["spanking", "voyeurism", "praise"] },
    { text: "Must be sex paraphernalia.", hint: "Sex toys or accessories.", examples: ["vibrator", "blindfold", "riding crop"] },
    { text: "Must rhyme with a moan.", hint: "-oan or -oh sounds.", examples: ["groan", "own", "known"] },
    { text: "Must be something you'd find in a sex dungeon.", hint: "Dungeon interior.", examples: ["chains", "paddle", "rope"] },
    { text: "Must be a safe word category.", hint: "Things used as safe words.", examples: ["pineapple", "red", "banana"] },
    { text: "Must be something that ends in a moan.", hint: "Word ends with -oan / -own.", examples: ["moan", "known", "throne"] },
  ],
};
