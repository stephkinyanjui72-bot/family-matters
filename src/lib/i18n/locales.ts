// The 7 supported locales. Order = order shown in the language switcher.
export const LOCALES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "pt", label: "Português", flag: "🇧🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
] as const;

export type LocaleCode = typeof LOCALES[number]["code"];

export const DEFAULT_LOCALE: LocaleCode = "en";

export function isLocaleCode(v: string | null | undefined): v is LocaleCode {
  return !!v && LOCALES.some((l) => l.code === v);
}

// Pick the best match from the browser's preferred languages. Falls back to
// the default locale when none of them match our supported set.
export function detectBrowserLocale(): LocaleCode {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;
  const prefs = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const raw of prefs) {
    const base = raw.toLowerCase().split("-")[0];
    if (isLocaleCode(base)) return base;
  }
  return DEFAULT_LOCALE;
}
