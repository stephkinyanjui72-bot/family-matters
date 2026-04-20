import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabaseServer";
import { reconcileRoom } from "../../../_lib/roomHelpers";

export const dynamic = "force-dynamic";

// Mirrors the old room:leave socket event. Deletes the player row; reconcile
// promotes a new host if needed or deletes the room if empty.
export async function POST(req: Request, { params }: { params: { code: string } }) {
  const code = (params.code || "").toUpperCase();
  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const pid = String(body.pid || "");
  if (!pid) return NextResponse.json({ ok: false, error: "Missing pid" }, { status: 400 });

  const sb = getAdminSupabase();
  await sb.from("room_players").delete().eq("room_code", code).eq("pid", pid);
  await reconcileRoom(code);
  return NextResponse.json({ ok: true });
}
