"use client";
import { useStore } from "@/lib/store";

export function TurnBanner({ playerId, label = "Your turn" }: { playerId: string | null | undefined; label?: string }) {
  const { pid } = useStore();
  if (!playerId || pid !== playerId) return null;
  return (
    <div className="card-glow pop-in text-center border-flame/60 pulse-ring">
      <div className="text-xs uppercase tracking-[0.3em] text-flame font-bold">🎯 {label}</div>
    </div>
  );
}

export function WaitingFor({ name }: { name: string | undefined | null }) {
  if (!name) return null;
  return (
    <p className="text-center text-white/50 text-sm uppercase tracking-widest">
      Waiting for <b className="text-white/80">{name}</b>…
    </p>
  );
}
