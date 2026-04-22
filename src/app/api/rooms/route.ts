import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabaseServer";
import { clampName, makeRoomCode, newPid } from "../_lib/roomHelpers";
import type { Intensity } from "@/lib/types";

export const dynamic = "force-dynamic";

// Create a new room. Gated on:
//   1. The X-Party-Mate-Native: 1 header — only our Android app sends it
//   2. A valid Supabase access token (Bearer) — signed-in user
//   3. An 18+ age check from the user's profile
// Body: { name, intensity }.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const name = clampName(body.name, "Host");
  const intensity = (["mild", "spicy", "extreme", "chaos"].includes(body.intensity as string)
    ? body.intensity
    : "spicy") as Intensity;

  // --- Platform check: hosting is native-app only ------------------------
  const isNative = req.headers.get("x-party-mate-native") === "1";
  if (!isNative) {
    return NextResponse.json(
      { ok: false, error: "Install the Android app to host a party" },
      { status: 403 },
    );
  }

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

  // Age check: 13+ to host at all. Under-18 can only host Mild-tier rooms
  // (adult-only tiers are hidden from them in the UI too).
  const { data: profile } = await sb
    .from("profiles")
    .select("birthdate, display_name")
    .eq("id", authUser.id)
    .maybeSingle();
  const dob = (profile as { birthdate?: string | null } | null)?.birthdate ?? null;
  const age = computeAge(dob);
  if (age === null) {
    return NextResponse.json({ ok: false, error: "Birthdate missing on profile" }, { status: 403 });
  }
  if (age < 13) {
    return NextResponse.json({ ok: false, error: "13+ account required" }, { status: 403 });
  }
  if (age < 18 && intensity !== "mild") {
    return NextResponse.json({ ok: false, error: "Teen accounts can only host Mild parties" }, { status: 403 });
  }
  // ----------------------------------------------------------------------

  // Insert-then-retry on PK conflict — saves a SELECT per attempt vs the
  // previous select-then-insert loop. 4-char codes from a 32-char alphabet
  // give ~1M combos, so collisions are rare and the first attempt almost
  // always succeeds.
  let code = "";
  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = makeRoomCode();
    const { error: insertRoomErr } = await sb.from("rooms").insert({
      code: candidate,
      host_user_id: authUser.id,
      intensity,
      current_game: null,
      game_state: null,
      bags: {},
    });
    if (!insertRoomErr) { code = candidate; break; }
    // 23505 = Postgres unique_violation. Any other error is fatal.
    if (insertRoomErr.code !== "23505") {
      return NextResponse.json({ ok: false, error: insertRoomErr.message }, { status: 500 });
    }
  }
  if (!code) return NextResponse.json({ ok: false, error: "Could not allocate room code" }, { status: 500 });

  const pid = newPid();
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
