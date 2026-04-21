import type { Intensity } from "../types";

// Two pools: topics (what the player talks about) and forbidden words (which
// they can't say during the 30-sec topic). Mix a random topic with 2 random
// taboos each round.

export const topics: Record<Intensity, string[]> = {
  mild: [
    "Describe your worst first date.",
    "Describe the best meal you've had this year.",
    "Tell us about your last vacation.",
    "Describe your dream house.",
    "Tell us about your childhood bedroom.",
    "Describe your perfect Sunday.",
    "Talk about your most embarrassing moment.",
    "Describe your favorite movie.",
    "Tell us about your worst job.",
    "Describe the last gift you gave.",
    "Talk about your best friend growing up.",
    "Describe your favorite holiday tradition.",
  ],
  spicy: [
    "Describe your last make-out session.",
    "Tell us about your first crush.",
    "Describe your dating type.",
    "Talk about the best kiss you've ever had.",
    "Describe your most awkward hookup.",
    "Tell us about your most used emoji when flirting.",
    "Describe your ideal first date.",
    "Talk about what turns you on.",
    "Describe someone attractive in this room without saying names.",
    "Tell us about your worst bedroom story.",
    "Describe your flirting strategy.",
    "Talk about the hottest DM you've sent.",
  ],
  extreme: [
    "Describe the best sex of your life.",
    "Describe your wildest hookup.",
    "Tell us about your kinkiest night.",
    "Describe the last time you touched yourself.",
    "Talk about your most intense orgasm.",
    "Describe what you like done to you.",
    "Tell us the filthiest place you've hooked up.",
    "Describe your favorite fantasy.",
    "Talk about the best oral you've given or received.",
    "Describe a threesome you've been in or wanted to be.",
    "Tell us how you'd seduce someone in this room.",
    "Describe the kinkiest text you've ever sent.",
  ],
  chaos: [
    "Describe exactly how you like to be fucked.",
    "Describe the filthiest position you've tried.",
    "Talk about the time you came hardest.",
    "Describe the last nude you sent and to who.",
    "Tell us your dirtiest fantasy involving someone in this room.",
    "Describe what you'd let a stranger do to you for $10,000.",
    "Talk about the wildest thing you've paid for sexually.",
    "Describe the closest you've come to cheating.",
    "Tell us about the last stranger you hooked up with.",
    "Describe the kinkiest thing you've ever agreed to.",
    "Describe your deepest kink nobody knows about.",
    "Talk about the time you got caught in the act.",
  ],
};

export const forbidden: Record<Intensity, string[]> = {
  mild: [
    "um", "like", "the", "and", "really", "very", "thing", "stuff", "cool",
    "good", "bad", "nice", "big", "small", "maybe", "sort of", "kind of",
    "literally", "basically", "actually", "right", "yeah", "okay",
  ],
  spicy: [
    "kiss", "love", "hot", "cute", "sexy", "bed", "date", "flirt", "crush",
    "text", "lips", "touch", "dress", "naked", "makeout", "mouth", "body",
    "hand", "heart", "romantic", "attractive", "smile",
  ],
  extreme: [
    "sex", "kiss", "naked", "bed", "hot", "body", "touch", "tongue", "lips",
    "mouth", "breast", "butt", "ass", "thigh", "moan", "wet", "hard", "deep",
    "came", "fuck", "suck", "horny", "cum", "lick",
  ],
  chaos: [
    "fuck", "cum", "cock", "pussy", "ass", "wet", "hard", "deep", "moan",
    "tongue", "suck", "lick", "nipple", "thrust", "climax", "orgasm", "tight",
    "ride", "grind", "slap", "choke", "beg", "dirty", "slut",
  ],
};
