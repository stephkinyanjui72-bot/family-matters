"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_LOCALE, LocaleCode, detectBrowserLocale, isLocaleCode } from "./locales";
import en from "./messages/en.json";
import es from "./messages/es.json";
import fr from "./messages/fr.json";
import pt from "./messages/pt.json";
import de from "./messages/de.json";
import it from "./messages/it.json";
import hi from "./messages/hi.json";

const MESSAGES: Record<LocaleCode, Record<string, unknown>> = {
  en, es, fr, pt, de, it, hi,
};

const LS_KEY = "party:locale";

type Ctx = {
  locale: LocaleCode;
  setLocale: (l: LocaleCode) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const I18nCtx = createContext<Ctx | null>(null);

// Walk a nested object by dot path. Returns undefined if missing.
function lookup(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, k) => {
    if (acc && typeof acc === "object" && k in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[k];
    }
    return undefined;
  }, obj);
}

// Replace {foo} placeholders with values from params.
function interpolate(s: string, params?: Record<string, string | number>): string {
  if (!params) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => (k in params ? String(params[k]) : `{${k}}`));
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>(DEFAULT_LOCALE);

  // Hydrate: localStorage wins, else browser detection, else default.
  useEffect(() => {
    let chosen: LocaleCode = DEFAULT_LOCALE;
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (isLocaleCode(stored)) chosen = stored;
      else chosen = detectBrowserLocale();
    } catch {
      chosen = detectBrowserLocale();
    }
    setLocaleState(chosen);
  }, []);

  // Keep <html lang> in sync so screen readers + browser features pick it up.
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const setLocale = useCallback((l: LocaleCode) => {
    setLocaleState(l);
    try { localStorage.setItem(LS_KEY, l); } catch {}
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const primary = lookup(MESSAGES[locale] as Record<string, unknown>, key);
      const fallback = locale === DEFAULT_LOCALE ? undefined : lookup(MESSAGES[DEFAULT_LOCALE] as Record<string, unknown>, key);
      const raw = typeof primary === "string" ? primary : typeof fallback === "string" ? fallback : key;
      return interpolate(raw, params);
    },
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const v = useContext(I18nCtx);
  if (!v) throw new Error("useI18n must be inside I18nProvider");
  return v;
}

// Ergonomic hook — most callers only need t().
export function useT() {
  return useI18n().t;
}

// Tiny renderer for strings containing <b>…</b>. Safe — does not accept
// arbitrary HTML. Use for keys like liability.intro where bold is part of
// the message. Returns a React fragment.
export function RichText({ text }: { text: string }) {
  const parts = text.split(/(<b>.*?<\/b>)/g);
  return (
    <>
      {parts.map((part, i) => {
        const m = part.match(/^<b>(.*?)<\/b>$/);
        if (m) return <b key={i}>{m[1]}</b>;
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
