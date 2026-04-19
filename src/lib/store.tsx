"use client";
import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from "react";
import { getSocket, resetSocket } from "./socket";
import type { Intensity, Room, GameId } from "./types";

const LS_SESSION = "party:session";

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

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [room, setRoom] = useState<Room | null>(null);
  const [pid, setPid] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const sessionRef = useRef<Session | null>(null);

  useEffect(() => {
    const s = getSocket();

    const onConnect = () => {
      setConnected(true);
      // If we had a session, try to rejoin automatically.
      const session = sessionRef.current || loadSession();
      if (session && session.code && session.pid) {
        s.emit(
          "room:rejoin",
          { code: session.code, pid: session.pid, name: session.name },
          (res: { ok: boolean; code?: string; pid?: string; error?: string }) => {
            if (res.ok && res.pid) {
              setPid(res.pid);
              sessionRef.current = { ...session, pid: res.pid };
              saveSession(sessionRef.current);
            } else {
              // seat gone, clear session
              sessionRef.current = null;
              saveSession(null);
              setPid(null);
              setRoom(null);
            }
          }
        );
      }
    };
    const onDisconnect = () => setConnected(false);
    const onRoomUpdate = (r: Room) => setRoom(r);
    const onRoomClosed = () => {
      setRoom(null);
      setPid(null);
      sessionRef.current = null;
      saveSession(null);
    };

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    s.on("room:update", onRoomUpdate);
    s.on("room:closed", onRoomClosed);

    if (s.connected) onConnect();

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.off("room:update", onRoomUpdate);
      s.off("room:closed", onRoomClosed);
    };
  }, []);

  const createRoom = useCallback<Ctx["createRoom"]>((name, intensity) => {
    return new Promise((resolve) => {
      getSocket().emit(
        "room:create",
        { name, intensity },
        (res: { ok: boolean; code?: string; pid?: string; error?: string }) => {
          if (res.ok && res.code && res.pid) {
            setPid(res.pid);
            sessionRef.current = { code: res.code, pid: res.pid, name };
            saveSession(sessionRef.current);
            resolve({ ok: true, code: res.code });
          } else resolve({ ok: false, error: res.error || "Could not create" });
        }
      );
    });
  }, []);

  const joinRoom = useCallback<Ctx["joinRoom"]>((code, name) => {
    return new Promise((resolve) => {
      getSocket().emit(
        "room:join",
        { code, name },
        (res: { ok: boolean; code?: string; pid?: string; error?: string }) => {
          if (res.ok && res.code && res.pid) {
            setPid(res.pid);
            sessionRef.current = { code: res.code, pid: res.pid, name };
            saveSession(sessionRef.current);
            resolve({ ok: true, code: res.code });
          } else resolve({ ok: false, error: res.error });
        }
      );
    });
  }, []);

  const leaveRoom = useCallback(() => {
    const s = getSocket();
    s.emit("room:leave");
    sessionRef.current = null;
    saveSession(null);
    setRoom(null);
    setPid(null);
    resetSocket();
  }, []);

  const setIntensity = useCallback((i: Intensity) => getSocket().emit("room:setIntensity", i), []);
  const selectGame = useCallback((g: GameId) => getSocket().emit("game:select", g), []);
  const exitGame = useCallback(() => getSocket().emit("game:exit"), []);
  const gameAction = useCallback((type: string, payload?: unknown) => {
    getSocket().emit("game:action", { type, payload });
  }, []);

  const me = useMemo(() => room?.players.find((p) => p.id === pid) || null, [room, pid]);
  const isHost = !!me?.isHost;

  const value: Ctx = {
    room,
    pid,
    isHost,
    me,
    connected,
    createRoom,
    joinRoom,
    leaveRoom,
    setIntensity,
    selectGame,
    exitGame,
    gameAction,
  };

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const v = useContext(StoreCtx);
  if (!v) throw new Error("useStore must be inside StoreProvider");
  return v;
}
