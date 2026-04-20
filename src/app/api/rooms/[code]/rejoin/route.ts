import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabaseServer";
import { clampName, newPid } from "../../../_lib/roomHelpers";

export const dynamic = "force-dynamic";

// Rejoin using a pid from localStorage. If the seat was cleared, fall back
// to a fresh join so the player isn't stranded.
export async function POST(req: Request, { params }: { params: { code: string } }) {
  const code = (params.code || "").toUpperCase();
  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const pid = String(body.pid || "");
  const name = clampName(body.name, "Player");

  const sb = getAdminSupabase();
  const { data: room } = await sb.from("rooms").select("code").eq("code", code).maybeSingle();
  if (!room) return NextResponse.json({ ok: false, error: "Room gone" }, { status: 404 });

  if (pid) {
    const { data: existing } = await sb
      .from("room_players")
      .select("*")
      .eq("room_code", code)
      .eq("pid", pid)
      .maybeSingle();
    if (existing) {
      await sb.from("room_players").update({
        online: true,
        last_seen: new Date().toISOString(),
        ...(name ? { name } : {}),
      }).eq("room_code", code).eq("pid", pid);
      return NextResponse.json({ ok: true, code, pid });
    }
  }

  const { count } = await sb
    .from("room_players")
    .select("pid", { count: "exact", head: true })
    .eq("room_code", code);
  if ((count ?? 0) >= 20) return NextResponse.json({ ok: false, error: "Room is full" }, { status: 403 });

  const fresh = newPid();
  const { error } = await sb.from("room_players").insert({
    room_code: code, pid: fresh, user_id: null, name, is_host: false, online: true,
  });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, code, pid: fresh });
}
