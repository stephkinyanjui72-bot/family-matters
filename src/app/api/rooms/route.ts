import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabaseServer";
import { clampName, makeRoomCode, newPid } from "../_lib/roomHelpers";
import type { Intensity } from "@/lib/types";

export const dynamic = "force-dynamic";

// Create a new room. Body: { name, intensity }. Returns { code, pid }.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const name = clampName(body.name, "Host");
  const intensity = (["mild", "spicy", "extreme", "chaos"].includes(body.intensity as string)
    ? body.intensity
    : "spicy") as Intensity;

  const sb = getAdminSupabase();

  // Retry a handful of times if we collide with an existing code.
  let code = "";
  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = makeRoomCode();
    const { data: existing } = await sb.from("rooms").select("code").eq("code", candidate).maybeSingle();
    if (!existing) { code = candidate; break; }
  }
  if (!code) return NextResponse.json({ ok: false, error: "Could not allocate room code" }, { status: 500 });

  const pid = newPid();
  const { error: insertRoomErr } = await sb.from("rooms").insert({
    code,
    host_user_id: null,
    intensity,
    current_game: null,
    game_state: null,
    bags: {},
  });
  if (insertRoomErr) return NextResponse.json({ ok: false, error: insertRoomErr.message }, { status: 500 });

  const { error: insertPlayerErr } = await sb.from("room_players").insert({
    room_code: code,
    pid,
    user_id: null,
    name,
    is_host: true,
    online: true,
  });
  if (insertPlayerErr) {
    await sb.from("rooms").delete().eq("code", code);
    return NextResponse.json({ ok: false, error: insertPlayerErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, code, pid });
}
