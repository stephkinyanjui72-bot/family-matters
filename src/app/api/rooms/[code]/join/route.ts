import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabaseServer";
import { clampName, newPid } from "../../../_lib/roomHelpers";

export const dynamic = "force-dynamic";

// Join an existing room as a new player. Body: { name }.
export async function POST(req: Request, { params }: { params: { code: string } }) {
  const code = (params.code || "").toUpperCase();
  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const name = clampName(body.name, "Player");

  const sb = getAdminSupabase();
  const { data: room } = await sb.from("rooms").select("code").eq("code", code).maybeSingle();
  if (!room) return NextResponse.json({ ok: false, error: "Room not found" }, { status: 404 });

  const { count } = await sb
    .from("room_players")
    .select("pid", { count: "exact", head: true })
    .eq("room_code", code);
  if ((count ?? 0) >= 20) return NextResponse.json({ ok: false, error: "Room is full" }, { status: 403 });

  const pid = newPid();
  const { error } = await sb.from("room_players").insert({
    room_code: code, pid, user_id: null, name, is_host: false, online: true,
  });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, code, pid });
}
