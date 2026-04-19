"use client";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";

export function SpinTheBottle() {
  const { room, gameAction } = useStore();
  const bottleRef = useRef<HTMLDivElement>(null);
  const [animating, setAnimating] = useState(false);
  if (!room) return null;
  const state = (room.gameState || {}) as { spinning: boolean; pickerIndex: number | null; targetIndex: number | null; seed: number };

  const n = room.players.length;
  const radius = 130;
  const size = 300;
  const center = size / 2;

  useEffect(() => {
    if (!state.spinning || state.targetIndex == null || !bottleRef.current) return;
    setAnimating(true);
    const el = bottleRef.current;
    const targetAngle = (360 / n) * state.targetIndex;
    const spins = 6;
    const final = 360 * spins + targetAngle;
    el.style.transition = "none";
    el.style.transform = "rotate(0deg)";
    void el.offsetHeight;
    el.style.transition = "transform 3.2s cubic-bezier(0.12, 0.8, 0.2, 1)";
    el.style.transform = `rotate(${final}deg)`;
    const t = setTimeout(() => {
      setAnimating(false);
      gameAction("settle");
    }, 3300);
    return () => clearTimeout(t);
  }, [state.seed, state.spinning, state.targetIndex, n, gameAction]);

  const picker = state.pickerIndex != null ? room.players[state.pickerIndex] : null;
  const target = state.targetIndex != null ? room.players[state.targetIndex] : null;

  return (
    <div className="flex flex-col gap-5 items-center pop-in">
      <div className="relative" style={{ width: size, height: size }}>
        <div
          className="absolute inset-0 rounded-full border border-white/10"
          style={{
            background: "radial-gradient(circle, rgba(255,61,110,0.15), transparent 65%)",
            boxShadow: "inset 0 0 60px rgba(180,107,255,0.15)",
          }}
        />
        {room.players.map((p, i) => {
          const angle = (360 / n) * i - 90;
          const x = center + radius * Math.cos((angle * Math.PI) / 180);
          const y = center + radius * Math.sin((angle * Math.PI) / 180);
          const isPicker = state.pickerIndex === i;
          const isTarget = state.targetIndex === i && !animating;
          return (
            <div
              key={p.id}
              className={`absolute -translate-x-1/2 -translate-y-1/2 text-sm font-bold rounded-full px-3 py-1 border transition-all ${
                isTarget
                  ? "bg-gradient-to-r from-flame to-ember text-white border-white/40 shadow-lg shadow-flame/50 scale-110 pulse-ring"
                  : isPicker && !animating
                  ? "bg-sky-500/30 border-sky-400 text-white"
                  : "bg-white/10 border-white/15 text-white/80"
              }`}
              style={{ left: x, top: y }}
            >
              {p.name}
            </div>
          );
        })}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div ref={bottleRef} className="origin-center" style={{ transform: "rotate(0deg)" }}>
            <div className="relative">
              <div className="w-4 h-28 bg-gradient-to-b from-ember via-flame to-rose-600 rounded-b-full shadow-2xl shadow-flame/60" />
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-2 h-10 bg-gradient-to-b from-yellow-200 via-ember to-flame rounded-full shadow-lg shadow-ember/50" />
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-3 h-3 bg-yellow-200 rounded-full shadow-[0_0_15px_rgba(255,230,100,0.9)]" />
            </div>
          </div>
        </div>
      </div>

      {!animating && picker && target && !state.spinning && (
        <div className="card-glow w-full pop-in">
          <div className="text-[10px] uppercase tracking-[0.3em] text-white/50">The bottle points</div>
          <div className="title text-2xl font-black mt-1">
            <span className="text-sky-300">{picker.name}</span>
            <span className="text-white/40 mx-2">→</span>
            <span className="holo-text">{target.name}</span>
          </div>
          <p className="text-white/60 text-sm mt-2">Kiss, dare, or drink. Room's call.</p>
        </div>
      )}

      <button className="btn-primary w-full text-xl title" onClick={() => gameAction("spin")}>
        {animating ? "Spinning…" : "🌀 SPIN!"}
      </button>
    </div>
  );
}
