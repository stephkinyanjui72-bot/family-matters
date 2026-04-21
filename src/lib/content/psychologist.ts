import type { Intensity } from "../types";

// Each rule is a short directive the group silently follows when the
// psychologist asks yes/no questions. The psychologist must figure it out.
// Shown to everyone EXCEPT the current psychologist (client-side hides).

export const rules: Record<Intensity, string[]> = {
  mild: [
    "Answer every question as if you were the person on your left.",
    "Say 'yes' to any question that mentions a color. Otherwise be honest.",
    "Touch your nose before answering. If you don't, your answer must be a lie.",
    "Answer everything as if you're 5 years old.",
    "Only give one-word answers. Anything longer is a lie.",
    "Say 'yes' to anything food-related. 'No' to anything money-related.",
    "Answer as the person directly across the circle from you.",
    "Only tell the truth if the question contains the letter 'S'.",
    "Pretend you're the most famous person in the world when answering.",
    "Answer every question like you're trying to hide something.",
  ],
  spicy: [
    "Answer as if every question is secretly about your ex.",
    "Say 'yes' to anything suggestive. 'No' to anything wholesome.",
    "Answer as the player you'd most want to kiss in this room.",
    "Every answer has to end with a wink.",
    "Pretend you're on a first date with the psychologist.",
    "Answer every question like you're flirting, whether it makes sense or not.",
    "Say 'yes' to any question that could be interpreted sexually.",
    "Answer everything like it's a secret you're embarrassed by.",
    "Pretend every yes-no question is about whether you'd sleep with the asker.",
    "Answer as if you have a massive crush on the person to your left.",
  ],
  extreme: [
    "Answer every question as if you're describing the best sex of your life.",
    "Every answer must include a double entendre, even if it doesn't fit.",
    "Say 'yes' to anything kinky. 'No' to anything vanilla.",
    "Answer as the hottest person you've ever hooked up with.",
    "Every answer is actually about your last one-night stand, disguised.",
    "Say 'yes' to anything and then add a filthy detail.",
    "Answer as if you're trying to seduce the psychologist.",
    "Pretend every question is really asking about your deepest kink.",
    "Answer every question as if you're describing a fantasy.",
    "Say 'yes' if the answer could be interpreted as dirty. Otherwise lie.",
  ],
  chaos: [
    "Answer as if every question is actually asking how you want to be fucked.",
    "Every answer must include a body part and what you'd do with it.",
    "Say 'yes' to anything involving the psychologist's body.",
    "Answer as if you're describing a threesome you've had — even if the question is about groceries.",
    "Every answer has to be a filthy confession, true or false.",
    "Say 'yes' to anything and give a graphic reason.",
    "Answer as if you're the psychologist's secret kink.",
    "Every answer has to include a safe word.",
    "Pretend you're narrating a porno set in this room.",
    "Answer as the kinkiest version of yourself, totally honestly.",
  ],
};
