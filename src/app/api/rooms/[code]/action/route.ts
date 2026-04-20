import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabaseServer";
import { loadRoomSnapshot } from "../../../_lib/roomHelpers";
import { reduceGame } from "@/lib/gameReducer";

export const dynamic = "force-dynamic";

// Apply a game action. Body: { pid, action: { type, payload } }
export async function POST(req: Request, { params }: { params: { code: string } }) {
  const code = (params.code || "").toUpperCase();
  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const pid = String(body.pid || "");
  const action = body.action as { type?: string; payload?: Record<string, unknown> };
  if (!pid || !action || typeof action !== "object" || !action.type) {
    return NextResponse.json({ ok: false, error: "Bad action" }, { status: 400 });
  }

  const snap = await loadRoomSnapshot(code);
  if (!snap || !snap.currentGame) {
    return NextResponse.json({ ok: false, error: "No active game" }, { status: 404 });
  }

  const result = reduceGame(snap.currentGame, snap.gameState, { type: action.type, payload: action.payload }, pid, snap);
  if (!result) return NextResponse.json({ ok: true, noop: true });

  const sb = getAdminSupabase();
  const { error } = await sb.from("rooms").update({
    game_state: result.gameState as object,
    bags: result.bags,
  }).eq("code", code);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
