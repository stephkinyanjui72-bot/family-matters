"use client";
import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from "react";
import { getSupabase } from "./supabaseClient";
import type { Intensity, Room, GameId } from "./types";

const LS_SESSION = "party:session";
const HEARTBEAT_INTERVAL_MS = 15_000;

type Session = { code: string; pid: string; name: string };

type Ctx = {
  room: Room | null;
  pid: string | null;
  isHost: boolean;
  me: Room["players"][0] | null;
  connected: boolean;
  createRoom: (name: string, intensity: Intensity) => Promise<{ ok: boolean; code?: string; error?: string }>;
  joinRoom: (code: string, name: string) => Promise<{ ok: boolean; code?: string; error?: string }>;
  leaveRoom: () => void;
  setIntensity: (i: Intensity) => void;
  selectGame: (g: GameId) => void;
  exitGame: () => void;
  gameAction: (type: string, payload?: unknown) => void;
};

const StoreCtx = createContext<Ctx | null>(null);

function saveSession(s: Session | null) {
  try {
    if (s) localStorage.setItem(LS_SESSION, JSON.stringify(s));
    else localStorage.removeItem(LS_SESSION);
  } catch {}
}
function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(LS_SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Fetch the room + players from Supabase and shape into the Room type the UI uses.
async function fetchRoomState(code: string): Promise<Room | null> {
  const sb = getSupabase();
  const upper = code.toUpperCase();
  const [roomRes, playersRes] = await Promise.all([
    sb.from("rooms").select("*").eq("code", upper).maybeSingle(),
    sb.from("room_players").select("*").eq("room_code", upper).order("joined_at", { ascending: true }),
  ]);
  const roomRow = roomRes.data as Record<string, unknown> | null;
  const players = (playersRes.data || []) as Array<Record<string, unknown>>;
  if (!roomRow) return null;
  const hostPlayer = players.find((p) => !!p.is_host);
  return {
    code: String(roomRow.code),
    hostId: String(hostPlayer?.pid ?? ""),
    intensity: roomRow.intensity as Intensity,
    players: players.map((p) => ({
      id: String(p.pid),
      name: String(p.name),
      isHost: !!p.is_host,
      online: !!p.online,
    })),
    currentGame: (roomRow.current_game as GameId | null) ?? null,
    gameState: roomRow.game_state,
    bags: (roomRow.bags ?? {}) as Record<string, number[]>,
    createdAt: new Date(String(roomRow.created_at)).getTime(),
  };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [room, setRoom] = useState<Room | null>(null);
  const [pid, setPid] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const sessionRef = useRef<Session | null>(null);
  const subCodeRef = useRef<string | null>(null);

  // Subscribe to realtime updates for the given room code. Any DB change triggers
  // a full refetch — simpler than merging deltas and the payloads are tiny.
  useEffect(() => {
    if (!room?.code) return;
    const code = room.code.toUpperCase();
    if (subCodeRef.current === code) return;
    subCodeRef.current = code;

    const sb = getSupabase();
    const refetch = async () => {
      const next = await fetchRoomState(code);
      if (next) setRoom(next);
      else {
        // Room deleted on the server — clear our session.
        setRoom(null);
        setPid(null);
        sessionRef.current = null;
        saveSession(null);
      }
    };

    const channel = sb
      .channel(`room:${code}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms", filter: `code=eq.${code}` }, refetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_players", filter: `room_code=eq.${code}` }, refetch)
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setConnected(true);
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") setConnected(false);
      });

    return () => {
      subCodeRef.current = null;
      sb.removeChannel(channel);
    };
  }, [room?.code]);

  // On first load, if we have a cached session, try to rejoin.
  useEffect(() => {
    const session = loadSession();
    if (!session || !session.code || !session.pid) return;
    sessionRef.current = session;
    (async () => {
      const res = await fetch(`/api/rooms/${encodeURIComponent(session.code)}/rejoin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pid: session.pid, name: session.name }),
      }).then((r) => r.json()).catch(() => ({ ok: false }));
      if (res?.ok && res.pid) {
        setPid(res.pid);
        const effective = { ...session, pid: res.pid };
        sessionRef.current = effective;
        saveSession(effective);
        const next = await fetchRoomState(session.code);
        if (next) setRoom(next);
      } else {
        sessionRef.current = null;
        saveSession(null);
      }
    })();
  }, []);

  // Heartbeat + stale-sweep while the player is in a room. If the heartbeat
  // reports the room is gone (expired server-side), tear down our session.
  useEffect(() => {
    if (!room?.code || !pid) return;
    const code = room.code;
    let active = true;
    const ping = async () => {
      if (!active) return;
      try {
        const res = await fetch(`/api/rooms/${encodeURIComponent(code)}/heartbeat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pid }),
        }).then((r) => r.json()).catch(() => null);
        if (res && res.roomExists === false) {
          // Server expired our room while we were idle — drop the ghost session.
          setRoom(null);
          setPid(null);
          sessionRef.current = null;
          saveSession(null);
        }
      } catch {}
    };
    ping();
    const handle = setInterval(ping, HEARTBEAT_INTERVAL_MS);
    return () => { active = false; clearInterval(handle); };
  }, [room?.code, pid]);

  const createRoom = useCallback<Ctx["createRoom"]>(async (name, intensity) => {
    const res = await fetch(`/api/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, intensity }),
    }).then((r) => r.json()).catch((e) => ({ ok: false, error: String(e) }));
    if (!res?.ok || !res.code || !res.pid) return { ok: false, error: res?.error || "Could not create" };
    setPid(res.pid);
    sessionRef.current = { code: res.code, pid: res.pid, name };
    saveSession(sessionRef.current);
    const next = await fetchRoomState(res.code);
    if (next) setRoom(next);
    return { ok: true, code: res.code };
  }, []);

  const joinRoom = useCallback<Ctx["joinRoom"]>(async (code, name) => {
    const upper = code.toUpperCase();
    const res = await fetch(`/api/rooms/${encodeURIComponent(upper)}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }).then((r) => r.json()).catch((e) => ({ ok: false, error: String(e) }));
    if (!res?.ok || !res.code || !res.pid) return { ok: false, error: res?.error || "Could not join" };
    setPid(res.pid);
    sessionRef.current = { code: res.code, pid: res.pid, name };
    saveSession(sessionRef.current);
    const next = await fetchRoomState(res.code);
    if (next) setRoom(next);
    return { ok: true, code: res.code };
  }, []);

  const leaveRoom = useCallback(() => {
    const current = room?.code;
    const currentPid = pid;
    setRoom(null);
    setPid(null);
    sessionRef.current = null;
    saveSession(null);
    if (current && currentPid) {
      fetch(`/api/rooms/${encodeURIComponent(current)}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pid: currentPid }),
      }).catch(() => {});
    }
  }, [room?.code, pid]);

  const setIntensity = useCallback((i: Intensity) => {
    if (!room?.code || !pid) return;
    fetch(`/api/rooms/${encodeURIComponent(room.code)}/intensity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pid, intensity: i }),
    }).catch(() => {});
  }, [room?.code, pid]);

  const selectGame = useCallback((g: GameId) => {
    if (!room?.code || !pid) return;
    fetch(`/api/rooms/${encodeURIComponent(room.code)}/game`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pid, gameId: g }),
    }).catch(() => {});
  }, [room?.code, pid]);

  const exitGame = useCallback(() => {
    if (!room?.code || !pid) return;
    fetch(`/api/rooms/${encodeURIComponent(room.code)}/game`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pid }),
    }).catch(() => {});
  }, [room?.code, pid]);

  const gameAction = useCallback((type: string, payload?: unknown) => {
    if (!room?.code || !pid) return;
    fetch(`/api/rooms/${encodeURIComponent(room.code)}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pid, action: { type, payload } }),
    }).catch(() => {});
  }, [room?.code, pid]);

  const me = useMemo(() => room?.players.find((p) => p.id === pid) || null, [room, pid]);
  const isHost = !!me?.isHost;

  const value: Ctx = {
    room, pid, isHost, me, connected,
    createRoom, joinRoom, leaveRoom,
    setIntensity, selectGame, exitGame, gameAction,
  };

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const v = useContext(StoreCtx);
  if (!v) throw new Error("useStore must be inside StoreProvider");
  return v;
}

// Read-only peek at the cached session without going through the store.
// Used by the home page to show a "leave stuck session" button.
export function peekSession(): { code: string; pid: string; name: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Hard-reset the stored session. Fire-and-forget — the server will expire
// the room on its own, but calling leave makes it instant.
export function clearStoredSession() {
  if (typeof window === "undefined") return;
  let stored: { code?: string; pid?: string } = {};
  try {
    const raw = localStorage.getItem(LS_SESSION);
    if (raw) stored = JSON.parse(raw);
  } catch {}
  try { localStorage.removeItem(LS_SESSION); } catch {}
  if (stored.code && stored.pid) {
    fetch(`/api/rooms/${encodeURIComponent(stored.code)}/leave`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pid: stored.pid }),
    }).catch(() => {});
  }
}
