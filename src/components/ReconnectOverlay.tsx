"use client";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";

export function ReconnectOverlay() {
  const { connected, room } = useStore();
  const [visible, setVisible] = useState(false);

  // Only show overlay after ~1s offline — avoids flicker on instant reconnects
  useEffect(() => {
    if (connected) { setVisible(false); return; }
    const t = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(t);
  }, [connected]);

  if (!visible || !room) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-6 backdrop-blur-md bg-black/60">
      <div className="card-glow max-w-sm text-center pop-in flex flex-col items-center gap-4">
        <Spinner />
        <p className="text-white/80 text-sm font-bold">Loading…</p>
      </div>
    </div>
  );
}

// Double-ring loading spinner using the app's flame/neon palette.
function Spinner() {
  return (
    <div className="relative w-16 h-16">
      <div
        className="absolute inset-0 rounded-full border-4 border-white/10"
      />
      <div
        className="absolute inset-0 rounded-full border-4 border-transparent animate-spin"
        style={{
          borderTopColor: "rgb(var(--flame))",
          borderRightColor: "rgb(var(--ember))",
          animationDuration: "0.9s",
        }}
      />
    </div>
  );
}
