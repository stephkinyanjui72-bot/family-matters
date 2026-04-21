import { getAdminSupabase } from "@/lib/supabaseServer";
import type { RoomSnapshot } from "@/lib/gameReducer";
import { MIN_PLAYERS, normalizeGameState } from "@/lib/gameReducer";
import type { GameId, Intensity } from "@/lib/types";
import crypto from "crypto";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

// Rooms auto-expire after 2 hours without any state change. The `rooms.updated_at`
// column is bumped by a DB trigger on every write (player join/leave, game action,
// heartbeat sweep), so genuinely active rooms keep sliding forward.
export const ROOM_EXPIRE_MS = 2 * 60 * 60 * 1000;

export function newPid() {
  return crypto.randomBytes(6).toString("hex");
}

export function makeRoomCode() {
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

export function clampName(raw: unknown, fallback = "Player"): string {
  const s = String(raw ?? "").trim();
  if (!s) return fallback;
  return s.slice(0, 20);
}

// Sweep any room that hasn't changed in the last ROOM_EXPIRE_MS. Cheap —
// a single DELETE with a cutoff; rows cascade-delete their player rows.
export async function expireStaleRooms(): Promise<void> {
  const sb = getAdminSupabase();
  const cutoff = new Date(Date.now() - ROOM_EXPIRE_MS).toISOString();
  await sb.from("rooms").delete().lt("updated_at", cutoff);
}

// Read a single room + its players and shape it as the RoomSnapshot we pass to
// the reducer. Sweeps expired rooms first so callers never see stale data.
export async function loadRoomSnapshot(code: string): Promise<RoomSnapshot | null> {
  await expireStaleRooms();
  const sb = getAdminSupabase();
  const upper = code.toUpperCase();
  const { data: room, error } = await sb.from("rooms").select("*").eq("code", upper).maybeSingle();
  if (error || !room) return null;
  const { data: players } = await sb
    .from("room_players")
    .select("*")
    .eq("room_code", upper)
    .order("joined_at", { ascending: true });
  return {
    code: room.code,
    hostId: room.host_user_id ?? ((players || []).find((p: any) => p.is_host)?.pid ?? ""),
    intensity: room.intensity as Intensity,
    players: (players || []).map((p: any) => ({
      id: p.pid,
      name: p.name,
      isHost: p.is_host,
      online: p.online,
    })),
    currentGame: (room.current_game as GameId) ?? null,
    gameState: room.game_state,
    bags: room.bags || {},
  };
}

// Ensure the host row has isHost=true; if the current host is offline, promote
// the first online player. Mirrors the old server.js ensureHostIsPresent.
async function ensureHostIsPresent(code: string) {
  const sb = getAdminSupabase();
  const { data: players } = await sb.from("room_players").select("*").eq("room_code", code);
  if (!players || players.length === 0) return;
  const host = players.find((p: any) => p.is_host && p.online);
  if (host) return;
  const first = players.find((p: any) => p.online) || players[0];
  await sb.from("room_players").update({ is_host: false }).eq("room_code", code).neq("pid", first.pid);
  await sb.from("room_players").update({ is_host: true }).eq("room_code", code).eq("pid", first.pid);
}

// Called after any membership change. Promotes a new host if needed and
// normalizes the game state (strips votes from departed players, etc.).
export async function reconcileRoom(code: string) {
  const sb = getAdminSupabase();
  await ensureHostIsPresent(code);
  const snap = await loadRoomSnapshot(code);
  if (!snap) return;
  if (snap.players.length === 0) {
    await sb.from("rooms").delete().eq("code", code);
    return;
  }
  const normalized = normalizeGameState(snap);
  if (normalized.currentGame !== snap.currentGame || normalized.gameState !== snap.gameState) {
    await sb.from("rooms").update({
      current_game: normalized.currentGame,
      game_state: normalized.gameState,
    }).eq("code", code);
  }
}

export function canStartGame(gameId: GameId, playerCount: number): boolean {
  return playerCount >= (MIN_PLAYERS[gameId] || 2);
}
