import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabaseServer";
import { reconcileRoom } from "../../../_lib/roomHelpers";

export const dynamic = "force-dynamic";

// Host-only: remove a player from the room.
// Body: { pid: hostPid, target: pidToKick }
export async function POST(req: Request, { params }: { params: { code: string } }) {
  const code = (params.code || "").toUpperCase();
  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const hostPid = String(body.pid || "");
  const target = String(body.target || "");
  if (!hostPid || !target) {
    return NextResponse.json({ ok: false, error: "Missing pid or target" }, { status: 400 });
  }
  if (hostPid === target) {
    return NextResponse.json({ ok: false, error: "Use Leave to exit your own room" }, { status: 400 });
  }

  const sb = getAdminSupabase();
  const { data: host } = await sb
    .from("room_players")
    .select("is_host")
    .eq("room_code", code)
    .eq("pid", hostPid)
    .maybeSingle();
  if (!host?.is_host) {
    return NextResponse.json({ ok: false, error: "Host only" }, { status: 403 });
  }

  await sb.from("room_players").delete().eq("room_code", code).eq("pid", target);
  await reconcileRoom(code);

  return NextResponse.json({ ok: true });
}
