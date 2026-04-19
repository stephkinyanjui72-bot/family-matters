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
      <div className="card-glow max-w-sm text-center pop-in">
        <div className="text-4xl float-slow mb-2">📡</div>
        <div className="title text-xl font-black">Reconnecting…</div>
        <p className="text-white/60 text-sm mt-2">
          Your seat is held. Just getting back on the line.
        </p>
      </div>
    </div>
  );
}
