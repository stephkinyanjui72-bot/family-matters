import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabaseServer";
import { canStartGame, loadRoomSnapshot } from "../../../_lib/roomHelpers";
import { initialGameState } from "@/lib/gameReducer";
import type { GameId } from "@/lib/types";

export const dynamic = "force-dynamic";

const VALID_GAMES: GameId[] = [
  "truth-or-dare","do-or-drink","never-have-i-ever","most-likely-to","would-you-rather",
  "paranoia","spin-the-bottle","two-truths-and-a-lie","hot-seat","kiss-marry-avoid",
];

// Host-only: select a game.
export async function POST(req: Request, { params }: { params: { code: string } }) {
  const code = (params.code || "").toUpperCase();
  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const pid = String(body.pid || "");
  const gameId = body.gameId as GameId;
  if (!VALID_GAMES.includes(gameId)) {
    return NextResponse.json({ ok: false, error: "Bad gameId" }, { status: 400 });
  }

  const snap = await loadRoomSnapshot(code);
  if (!snap) return NextResponse.json({ ok: false, error: "Room not found" }, { status: 404 });
  const me = snap.players.find((p) => p.id === pid);
  if (!me?.isHost) return NextResponse.json({ ok: false, error: "Host only" }, { status: 403 });
  if (!canStartGame(gameId, snap.players.length)) {
    return NextResponse.json({ ok: false, error: "Not enough players" }, { status: 400 });
  }

  const sb = getAdminSupabase();
  const { error } = await sb.from("rooms").update({
    current_game: gameId,
    game_state: initialGameState(gameId) as object,
  }).eq("code", code);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// Host-only: exit current game back to lobby.
export async function DELETE(req: Request, { params }: { params: { code: string } }) {
  const code = (params.code || "").toUpperCase();
  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const pid = String(body.pid || "");

  const sb = getAdminSupabase();
  const { data: player } = await sb
    .from("room_players")
    .select("is_host")
    .eq("room_code", code)
    .eq("pid", pid)
    .maybeSingle();
  if (!player?.is_host) return NextResponse.json({ ok: false, error: "Host only" }, { status: 403 });

  const { error } = await sb.from("rooms").update({
    current_game: null,
    game_state: null,
  }).eq("code", code);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
