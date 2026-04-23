"use client";
import { useMemo } from "react";
import { useI18n } from "@/lib/i18n/context";
import { WheelPicker } from "./WheelPicker";

// Three-wheel birthdate picker. Value is YYYY-MM-DD (or empty string).
// Day/month/year are independent wheels; days clamp to month length.
export function BirthdatePicker({
  value,
  onChange,
  minAge = 13,
  maxAge = 100,
}: {
  value: string;
  onChange: (v: string) => void;
  minAge?: number;
  maxAge?: number;
}) {
  const { locale } = useI18n();

  const { year, month, day } = parse(value);
  const now = new Date();
  const maxYear = now.getFullYear() - minAge;
  const minYear = now.getFullYear() - maxAge;

  // Default to the upper-bound year (the most likely year a 13+ user picks)
  // so the year wheel is centered on a sensible value when empty.
  const effectiveYear = year || maxYear;
  const effectiveMonth = month || 1;
  const effectiveDay = day || 1;

  const yearItems = useMemo(
    () =>
      Array.from({ length: maxYear - minYear + 1 }, (_, i) => {
        const y = maxYear - i;
        return { value: String(y), label: String(y) };
      }),
    [minYear, maxYear],
  );

  const monthItems = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { month: "short" });
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(2000, i, 1);
      return { value: pad(i + 1), label: fmt.format(d) };
    });
  }, [locale]);

  const daysInMonth = new Date(effectiveYear, effectiveMonth, 0).getDate();
  const dayItems = useMemo(
    () =>
      Array.from({ length: daysInMonth }, (_, i) => ({
        value: pad(i + 1),
        label: String(i + 1),
      })),
    [daysInMonth],
  );

  const emit = (y: number, m: number, d: number) => {
    const dim = new Date(y, m, 0).getDate();
    const safeDay = Math.min(d, dim);
    onChange(`${y}-${pad(m)}-${pad(safeDay)}`);
  };

  return (
    <div className="bg-white/5 border border-white/15 rounded-xl p-2">
      <div className="grid grid-cols-3 gap-1">
        <WheelPicker
          items={dayItems}
          value={pad(effectiveDay)}
          onChange={(v) => emit(effectiveYear, effectiveMonth, Number(v))}
          ariaLabel="Day"
        />
        <WheelPicker
          items={monthItems}
          value={pad(effectiveMonth)}
          onChange={(v) => emit(effectiveYear, Number(v), effectiveDay)}
          ariaLabel="Month"
        />
        <WheelPicker
          items={yearItems}
          value={String(effectiveYear)}
          onChange={(v) => emit(Number(v), effectiveMonth, effectiveDay)}
          ariaLabel="Year"
        />
      </div>
    </div>
  );
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function parse(v: string): { year: number; month: number; day: number } {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return { year: 0, month: 0, day: 0 };
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}
