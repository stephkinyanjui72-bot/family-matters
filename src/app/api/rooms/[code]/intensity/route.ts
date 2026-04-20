import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

// Host-only: change the intensity tier for the room.
export async function POST(req: Request, { params }: { params: { code: string } }) {
  const code = (params.code || "").toUpperCase();
  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const pid = String(body.pid || "");
  const intensity = body.intensity;
  if (!["mild", "spicy", "extreme", "chaos"].includes(intensity as string)) {
    return NextResponse.json({ ok: false, error: "Bad intensity" }, { status: 400 });
  }

  const sb = getAdminSupabase();
  const { data: player } = await sb
    .from("room_players")
    .select("is_host")
    .eq("room_code", code)
    .eq("pid", pid)
    .maybeSingle();
  if (!player?.is_host) return NextResponse.json({ ok: false, error: "Host only" }, { status: 403 });

  const { error } = await sb.from("rooms").update({ intensity }).eq("code", code);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
