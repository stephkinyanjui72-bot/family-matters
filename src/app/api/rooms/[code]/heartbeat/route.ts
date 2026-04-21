import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabaseServer";
import { expireStaleRooms } from "../../../_lib/roomHelpers";

export const dynamic = "force-dynamic";

// Lightweight presence ping. Client calls this every ~15s while in a room.
// Also sweeps stale online flags and expires inactive rooms.
const STALE_MS = 45_000;

export async function POST(req: Request, { params }: { params: { code: string } }) {
  const code = (params.code || "").toUpperCase();
  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const pid = String(body.pid || "");
  if (!pid) return NextResponse.json({ ok: false, error: "Missing pid" }, { status: 400 });

  // Every heartbeat: piggyback a sweep of rooms nobody's touched in 2 hours.
  await expireStaleRooms();

  const sb = getAdminSupabase();
  const now = new Date();
  const staleCutoff = new Date(now.getTime() - STALE_MS).toISOString();

  // Bumping last_seen also cascades to rooms.updated_at via foreign-key cascade;
  // to be safe we also touch the room itself so it stays fresh.
  await sb.from("room_players")
    .update({ online: true, last_seen: now.toISOString() })
    .eq("room_code", code)
    .eq("pid", pid);

  // Touch the room so its updated_at slides forward and the expire sweep spares it.
  await sb.from("rooms").update({ updated_at: now.toISOString() }).eq("code", code);

  // Mark anyone else in this room offline if their heartbeat is stale.
  await sb.from("room_players")
    .update({ online: false })
    .eq("room_code", code)
    .lt("last_seen", staleCutoff)
    .eq("online", true);

  // Report whether the room still exists — lets the client detect expiry.
  const { data: roomRow } = await sb.from("rooms").select("code").eq("code", code).maybeSingle();
  return NextResponse.json({ ok: true, roomExists: !!roomRow });
}
