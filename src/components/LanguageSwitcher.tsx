"use client";
import { useI18n } from "@/lib/i18n/context";
import { LOCALES, LocaleCode } from "@/lib/i18n/locales";

// Compact grid of locale chips. Lives in /profile > Language section.
export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  return (
    <div className="grid grid-cols-2 gap-2">
      {LOCALES.map((l) => {
        const active = l.code === locale;
        return (
          <button
            key={l.code}
            onClick={() => setLocale(l.code as LocaleCode)}
            className={`rounded-xl py-2.5 px-3 text-sm font-semibold border transition flex items-center gap-2 ${
              active
                ? "bg-flame/20 border-flame/50 text-white"
                : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
            }`}
          >
            <span className="text-base">{l.flag}</span>
            <span>{l.label}</span>
          </button>
        );
      })}
    </div>
  );
}
