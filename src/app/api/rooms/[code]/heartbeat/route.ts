import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

// Lightweight presence ping. Client calls this every ~15s while in a room.
// Also sweeps stale online flags to keep the UI honest.
const STALE_MS = 45_000;

export async function POST(req: Request, { params }: { params: { code: string } }) {
  const code = (params.code || "").toUpperCase();
  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const pid = String(body.pid || "");
  if (!pid) return NextResponse.json({ ok: false, error: "Missing pid" }, { status: 400 });

  const sb = getAdminSupabase();
  const now = new Date();
  const staleCutoff = new Date(now.getTime() - STALE_MS).toISOString();

  await sb.from("room_players")
    .update({ online: true, last_seen: now.toISOString() })
    .eq("room_code", code)
    .eq("pid", pid);

  // Mark anyone else in this room offline if their heartbeat is stale.
  await sb.from("room_players")
    .update({ online: false })
    .eq("room_code", code)
    .lt("last_seen", staleCutoff)
    .eq("online", true);

  return NextResponse.json({ ok: true });
}
