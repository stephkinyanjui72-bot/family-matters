"use client";
import { useEffect, useRef } from "react";

// Vertical scroll-snap "wheel" — one column of items, the centered one is
// the selected value. Designed to feel like an iOS picker. The container
// shows ITEM_HEIGHT * VISIBLE pixels; the center band is the selection.
const ITEM_HEIGHT = 36;
const VISIBLE = 5;

type Item = { value: string; label: string };

export function WheelPicker({
  items,
  value,
  onChange,
  ariaLabel,
}: {
  items: Item[];
  value: string;
  onChange: (v: string) => void;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastEmittedRef = useRef<string>(value);

  // Keep scroll position in sync when the value changes from outside.
  useEffect(() => {
    if (!ref.current) return;
    const idx = items.findIndex((i) => i.value === value);
    if (idx < 0) return;
    const target = idx * ITEM_HEIGHT;
    if (Math.abs(ref.current.scrollTop - target) > 1) {
      ref.current.scrollTop = target;
    }
    lastEmittedRef.current = value;
  }, [value, items]);

  const onScroll = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (!ref.current) return;
      const idx = Math.round(ref.current.scrollTop / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(items.length - 1, idx));
      const next = items[clamped]?.value;
      if (next && next !== lastEmittedRef.current) {
        lastEmittedRef.current = next;
        onChange(next);
      }
    }, 80);
  };

  const padding = ((VISIBLE - 1) / 2) * ITEM_HEIGHT;

  return (
    <div
      className="relative w-full"
      style={{ height: VISIBLE * ITEM_HEIGHT }}
      role="listbox"
      aria-label={ariaLabel}
    >
      {/* Highlight band over the center row */}
      <div
        className="absolute left-0 right-0 pointer-events-none border-y border-flame/40 bg-flame/5"
        style={{
          top: padding,
          height: ITEM_HEIGHT,
        }}
      />
      {/* Top + bottom fade for the wheel illusion */}
      <div className="absolute inset-x-0 top-0 h-12 pointer-events-none bg-gradient-to-b from-[rgb(var(--bg))] to-transparent z-10" />
      <div className="absolute inset-x-0 bottom-0 h-12 pointer-events-none bg-gradient-to-t from-[rgb(var(--bg))] to-transparent z-10" />

      <div
        ref={ref}
        onScroll={onScroll}
        className="h-full overflow-y-scroll snap-y snap-mandatory wheel-scroll"
        style={{ scrollbarWidth: "none" }}
      >
        <div style={{ height: padding }} />
        {items.map((item) => {
          const active = item.value === value;
          return (
            <div
              key={item.value}
              role="option"
              aria-selected={active}
              onClick={() => {
                if (!ref.current) return;
                const idx = items.findIndex((i) => i.value === item.value);
                ref.current.scrollTo({ top: idx * ITEM_HEIGHT, behavior: "smooth" });
              }}
              className={`flex items-center justify-center snap-center cursor-pointer transition select-none ${
                active ? "text-white font-bold text-lg" : "text-white/45 text-base"
              }`}
              style={{ height: ITEM_HEIGHT }}
            >
              {item.label}
            </div>
          );
        })}
        <div style={{ height: padding }} />
      </div>
    </div>
  );
}
