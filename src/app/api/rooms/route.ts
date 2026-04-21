import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabaseServer";
import { clampName, makeRoomCode, newPid } from "../_lib/roomHelpers";
import type { Intensity } from "@/lib/types";

export const dynamic = "force-dynamic";

// Create a new room. Now gated on an authenticated user — the client must
// forward its current access token (from supabase.auth.getSession) in the
// Authorization header. Body: { name, intensity }.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const name = clampName(body.name, "Host");
  const intensity = (["mild", "spicy", "extreme", "chaos"].includes(body.intensity as string)
    ? body.intensity
    : "spicy") as Intensity;

  // --- Auth check --------------------------------------------------------
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return NextResponse.json({ ok: false, error: "Sign in to host" }, { status: 401 });

  const sb = getAdminSupabase();
  const { data: userRes, error: userErr } = await sb.auth.getUser(token);
  const authUser = userRes?.user;
  if (userErr || !authUser) {
    return NextResponse.json({ ok: false, error: "Invalid session" }, { status: 401 });
  }

  // Age check: user must be 18+ to host anything. 18+ accounts get all tiers.
  const { data: profile } = await sb
    .from("profiles")
    .select("birthdate, display_name")
    .eq("id", authUser.id)
    .maybeSingle();
  const dob = (profile as { birthdate?: string | null } | null)?.birthdate ?? null;
  const age = computeAge(dob);
  if (age === null || age < 18) {
    return NextResponse.json({ ok: false, error: "18+ account required" }, { status: 403 });
  }
  // ----------------------------------------------------------------------

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
    host_user_id: authUser.id,
    intensity,
    current_game: null,
    game_state: null,
    bags: {},
  });
  if (insertRoomErr) return NextResponse.json({ ok: false, error: insertRoomErr.message }, { status: 500 });

  const hostName = (profile as { display_name?: string | null } | null)?.display_name || name;
  const { error: insertPlayerErr } = await sb.from("room_players").insert({
    room_code: code,
    pid,
    user_id: authUser.id,
    name: hostName,
    is_host: true,
    online: true,
  });
  if (insertPlayerErr) {
    await sb.from("rooms").delete().eq("code", code);
    return NextResponse.json({ ok: false, error: insertPlayerErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, code, pid });
}

function computeAge(dob: string | null): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}
