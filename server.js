// Custom Next.js server with Socket.io for LAN multiplayer.
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");
const os = require("os");
const crypto = require("crypto");

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT || "3000", 10);
const app = next({ dev, hostname: "0.0.0.0", port });
const handle = app.getRequestHandler();

const MIN_PLAYERS = {
  "truth-or-dare": 2,
  "do-or-drink": 2,
  "never-have-i-ever": 3,
  "most-likely-to": 3,
  "would-you-rather": 2,
  "paranoia": 3,
  "spin-the-bottle": 3,
  "two-truths-and-a-lie": 3,
  "hot-seat": 3,
  "kiss-marry-avoid": 2,
};

function lanIp() {
  if (process.env.LAN_IP) return process.env.LAN_IP;
  const ifaces = os.networkInterfaces();
  const candidates = [];
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name] || []) {
      if (iface.family !== "IPv4" || iface.internal) continue;
      const virtualSubnet = /^192\.168\.56\./.test(iface.address) || /^192\.168\.99\./.test(iface.address);
      const virtualName = /VirtualBox|VMware|Hyper-V|vEthernet|WSL|Loopback|Docker|TAP|TailScale/i.test(name);
      const wifiName = /Wi-?Fi|Wireless|WLAN/i.test(name);
      candidates.push({ name, address: iface.address, skip: virtualSubnet || virtualName, wifi: wifiName });
    }
  }
  const wifi = candidates.find((c) => !c.skip && c.wifi);
  if (wifi) return wifi.address;
  const real = candidates.find((c) => !c.skip);
  if (real) return real.address;
  return candidates[0]?.address || "localhost";
}

const rooms = new Map();         // code -> room
const socketPid = new Map();     // socketId -> { pid, code }
const disconnectTimers = new Map(); // pid -> timeout handle (grace window)
const DISCONNECT_GRACE_MS = 10 * 60 * 1000; // 10 min: party apps shouldn't evict on brief blips
const HOST_EVICT_GRACE_MS = 30 * 60 * 1000; // host gets 30 min before ever being demoted

function newPid() {
  return crypto.randomBytes(6).toString("hex");
}

function roomPublic(room) {
  if (!room) return null;
  return {
    code: room.code,
    hostId: room.hostId,
    intensity: room.intensity,
    players: room.players.map((p) => ({ id: p.id, name: p.name, isHost: p.isHost, online: p.online !== false })),
    currentGame: room.currentGame,
    gameState: room.gameState,
    bags: room.bags || {},
    createdAt: room.createdAt,
  };
}

// Shuffled-bag memory. Each draw records its index; once every item in a pool
// has been seen, the bag resets (but seeded with the just-drawn index so the
// first pick of the new cycle doesn't immediately repeat the last).
function recordDrawn(room, key, index, size) {
  if (!key || typeof index !== "number" || typeof size !== "number" || size <= 0) return;
  room.bags = room.bags || {};
  const prior = room.bags[key] || [];
  const next = prior.includes(index) ? prior : [...prior, index];
  room.bags[key] = next.length >= size ? [index] : next;
}

function emitRoom(io, room) {
  io.to(room.code).emit("room:update", roomPublic(room));
}

function makeRoomCode() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  do {
    code = "";
    for (let i = 0; i < 4; i++) code += letters[Math.floor(Math.random() * letters.length)];
  } while (rooms.has(code));
  return code;
}

function ensureHostIsPresent(room) {
  if (!room.players.length) return;
  const host = room.players.find((p) => p.id === room.hostId);
  if (!host || host.online === false) {
    const firstOnline = room.players.find((p) => p.online !== false) || room.players[0];
    room.players.forEach((p) => (p.isHost = p.id === firstOnline.id));
    room.hostId = firstOnline.id;
  }
}

function normalizeGameState(room) {
  if (!room.currentGame || !room.gameState) return;
  const n = room.players.length;
  if (n === 0) {
    room.currentGame = null;
    room.gameState = null;
    return;
  }
  const min = MIN_PLAYERS[room.currentGame] || 2;
  if (n < min) {
    room.currentGame = null;
    room.gameState = null;
    return;
  }
  const s = room.gameState;
  if (typeof s.turnIndex === "number") s.turnIndex = s.turnIndex % n;
  if (typeof s.askerIndex === "number") s.askerIndex = s.askerIndex % n;
  if (typeof s.victimIndex === "number") s.victimIndex = s.victimIndex % n;

  // Strip votes/choices for pids that left
  const livePids = new Set(room.players.map((p) => p.id));
  if (s.votes) {
    s.votes = Object.fromEntries(Object.entries(s.votes).filter(([pid]) => livePids.has(pid)));
  }
  if (s.choices) {
    s.choices = Object.fromEntries(Object.entries(s.choices).filter(([pid]) => livePids.has(pid)));
  }
  // Paranoia target might have left
  if (room.currentGame === "paranoia" && s.targetId && !livePids.has(s.targetId)) {
    s.targetId = null;
    s.prompt = null;
    s.revealed = false;
  }
  // Spin the bottle indices
  if (room.currentGame === "spin-the-bottle") {
    if (s.pickerIndex != null) s.pickerIndex = s.pickerIndex % n;
    if (s.targetIndex != null) s.targetIndex = s.targetIndex % n;
  }
}

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsed = parse(req.url, true);
    if (parsed.pathname === "/_lan") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ip: lanIp(), port }));
      return;
    }
    handle(req, res, parsed);
  });

  const io = new Server(server, { cors: { origin: "*" } });

  io.on("connection", (socket) => {
    socket.on("room:create", ({ name, intensity }, cb) => {
      const code = makeRoomCode();
      const pid = newPid();
      const player = { id: pid, name: (name || "Host").slice(0, 20), isHost: true, online: true, socketId: socket.id };
      const room = {
        code,
        hostId: pid,
        intensity: intensity || "spicy",
        players: [player],
        currentGame: null,
        gameState: null,
        bags: {},
        createdAt: Date.now(),
      };
      rooms.set(code, room);
      socketPid.set(socket.id, { pid, code });
      socket.join(code);
      cb({ ok: true, code, pid });
      emitRoom(io, room);
    });

    socket.on("room:join", ({ code, name }, cb) => {
      code = (code || "").toUpperCase();
      const room = rooms.get(code);
      if (!room) return cb({ ok: false, error: "Room not found" });
      if (room.players.length >= 20) return cb({ ok: false, error: "Room is full" });
      const pid = newPid();
      const player = { id: pid, name: (name || "Player").slice(0, 20), isHost: false, online: true, socketId: socket.id };
      room.players.push(player);
      socketPid.set(socket.id, { pid, code });
      socket.join(code);
      cb({ ok: true, code, pid });
      emitRoom(io, room);
    });

    socket.on("room:rejoin", ({ code, pid, name }, cb) => {
      code = (code || "").toUpperCase();
      const room = rooms.get(code);
      if (!room) return cb({ ok: false, error: "Room gone" });
      const existing = room.players.find((p) => p.id === pid);
      if (existing) {
        existing.online = true;
        existing.socketId = socket.id;
        if (name && name.trim()) existing.name = name.trim().slice(0, 20);
        const timer = disconnectTimers.get(pid);
        if (timer) { clearTimeout(timer); disconnectTimers.delete(pid); }
        socketPid.set(socket.id, { pid, code });
        socket.join(code);
        cb({ ok: true, code, pid });
        emitRoom(io, room);
      } else {
        // Fall back to a fresh join if the seat was cleared
        if (room.players.length >= 20) return cb({ ok: false, error: "Room is full" });
        const newid = newPid();
        const player = { id: newid, name: (name || "Player").slice(0, 20), isHost: false, online: true, socketId: socket.id };
        room.players.push(player);
        socketPid.set(socket.id, { pid: newid, code });
        socket.join(code);
        cb({ ok: true, code, pid: newid });
        emitRoom(io, room);
      }
    });

    socket.on("room:leave", () => {
      const meta = socketPid.get(socket.id);
      if (!meta) return;
      removePlayer(meta.pid, meta.code, { reason: "leave" });
      socketPid.delete(socket.id);
    });

    socket.on("room:setIntensity", (intensity) => {
      const meta = socketPid.get(socket.id);
      if (!meta) return;
      const room = rooms.get(meta.code);
      if (!room || room.hostId !== meta.pid) return;
      if (!["mild", "spicy", "extreme", "chaos"].includes(intensity)) return;
      room.intensity = intensity;
      emitRoom(io, room);
    });

    socket.on("game:select", (gameId) => {
      const meta = socketPid.get(socket.id);
      if (!meta) return;
      const room = rooms.get(meta.code);
      if (!room || room.hostId !== meta.pid) return;
      if (!(gameId in MIN_PLAYERS)) return;
      if (room.players.length < (MIN_PLAYERS[gameId] || 2)) return;
      room.currentGame = gameId;
      room.gameState = initialGameState(gameId, room);
      emitRoom(io, room);
    });

    socket.on("game:exit", () => {
      const meta = socketPid.get(socket.id);
      if (!meta) return;
      const room = rooms.get(meta.code);
      if (!room || room.hostId !== meta.pid) return;
      room.currentGame = null;
      room.gameState = null;
      emitRoom(io, room);
    });

    socket.on("game:action", (action) => {
      const meta = socketPid.get(socket.id);
      if (!meta) return;
      const room = rooms.get(meta.code);
      if (!room || !room.currentGame) return;
      const next = reduceGame(room.currentGame, room.gameState, action, meta.pid, room);
      if (next) {
        room.gameState = next;
        emitRoom(io, room);
      }
    });

    socket.on("disconnect", () => {
      const meta = socketPid.get(socket.id);
      if (!meta) return;
      socketPid.delete(socket.id);
      const room = rooms.get(meta.code);
      if (!room) return;
      const player = room.players.find((p) => p.id === meta.pid);
      if (player) {
        player.online = false;
        emitRoom(io, room);
      }
      // Hosts get a longer grace — we never want to yank their controls
      const isTheHost = room.hostId === meta.pid;
      const grace = isTheHost ? HOST_EVICT_GRACE_MS : DISCONNECT_GRACE_MS;
      const timer = setTimeout(() => {
        disconnectTimers.delete(meta.pid);
        removePlayer(meta.pid, meta.code, { reason: "timeout" });
      }, grace);
      disconnectTimers.set(meta.pid, timer);
    });
  });

  function removePlayer(pid, code, { reason }) {
    const room = rooms.get(code);
    if (!room) return;
    const player = room.players.find((p) => p.id === pid);
    if (!player) return;
    room.players = room.players.filter((p) => p.id !== pid);
    if (room.players.length === 0) {
      rooms.delete(code);
      return;
    }
    ensureHostIsPresent(room);
    normalizeGameState(room);
    emitRoom(io, room);
  }

  server.listen(port, "0.0.0.0", () => {
    console.log(`\n  Party app ready`);
    console.log(`  - Local:   http://localhost:${port}`);
    console.log(`  - Network: http://${lanIp()}:${port}\n`);
  });
});

// === Game reducers ===
function initialGameState(gameId, room) {
  switch (gameId) {
    case "truth-or-dare":
      return { turnIndex: 0, pick: null, prompt: null };
    case "do-or-drink":
      return { turnIndex: 0, challenge: null };
    case "never-have-i-ever":
      return { turnIndex: 0, prompt: null };
    case "most-likely-to":
      return { prompt: null, votes: {}, revealed: false };
    case "would-you-rather":
      return { prompt: null, votes: {}, revealed: false };
    case "paranoia":
      return { askerIndex: 0, targetId: null, prompt: null, revealed: false };
    case "spin-the-bottle":
      return { spinning: false, pickerIndex: null, targetIndex: null, seed: 0 };
    case "two-truths-and-a-lie":
      return { turnIndex: 0, statements: null, votes: {}, revealedLie: null };
    case "hot-seat":
      return { victimIndex: 0, prompt: null };
    case "kiss-marry-avoid":
      return { turnIndex: 0, options: null, choices: {} };
    default:
      return null;
  }
}

function reduceGame(gameId, state, action, actorPid, room) {
  if (!state || !action || typeof action !== "object") return state;
  const n = room.players.length;
  const currentByTurn = () => room.players[(state.turnIndex || 0) % n];
  const isHost = actorPid === room.hostId;

  switch (gameId) {
    case "truth-or-dare": {
      if (action.type === "pick") {
        if (actorPid !== currentByTurn().id && !isHost) return state;
        if (!action.payload || !["truth", "dare"].includes(action.payload.kind)) return state;
        recordDrawn(room, action.payload.poolKey, action.payload.index, action.payload.poolSize);
        return { ...state, pick: action.payload.kind, prompt: String(action.payload.prompt || "") };
      }
      if (action.type === "next" && isHost) {
        return { ...state, turnIndex: (state.turnIndex + 1) % n, pick: null, prompt: null };
      }
      return state;
    }
    case "do-or-drink": {
      if (action.type === "reveal" && isHost) {
        recordDrawn(room, action.payload?.poolKey, action.payload?.index, action.payload?.poolSize);
        return { ...state, challenge: String(action.payload?.challenge || "") };
      }
      if (action.type === "next" && isHost) {
        return { ...state, turnIndex: (state.turnIndex + 1) % n, challenge: null };
      }
      return state;
    }
    case "never-have-i-ever": {
      if (action.type === "reveal" && isHost) {
        recordDrawn(room, action.payload?.poolKey, action.payload?.index, action.payload?.poolSize);
        return { ...state, prompt: String(action.payload?.prompt || "") };
      }
      if (action.type === "next" && isHost) return { ...state, turnIndex: (state.turnIndex + 1) % n, prompt: null };
      return state;
    }
    case "most-likely-to": {
      if (action.type === "reveal" && isHost) {
        recordDrawn(room, action.payload?.poolKey, action.payload?.index, action.payload?.poolSize);
        return { ...state, prompt: String(action.payload?.prompt || ""), votes: {}, revealed: false };
      }
      if (action.type === "vote") {
        const target = action.payload?.playerId;
        if (!target || !room.players.some((p) => p.id === target)) return state;
        return { ...state, votes: { ...state.votes, [actorPid]: target } };
      }
      if (action.type === "tally" && isHost) return { ...state, revealed: true };
      if (action.type === "next" && isHost) return { ...state, prompt: null, votes: {}, revealed: false };
      return state;
    }
    case "would-you-rather": {
      if (action.type === "reveal" && isHost) {
        recordDrawn(room, action.payload?.poolKey, action.payload?.index, action.payload?.poolSize);
        return { ...state, prompt: action.payload?.prompt || null, votes: {}, revealed: false };
      }
      if (action.type === "vote") {
        if (!["a", "b"].includes(action.payload?.choice)) return state;
        return { ...state, votes: { ...state.votes, [actorPid]: action.payload.choice } };
      }
      if (action.type === "tally" && isHost) return { ...state, revealed: true };
      if (action.type === "next" && isHost) return { ...state, prompt: null, votes: {}, revealed: false };
      return state;
    }
    case "paranoia": {
      const asker = room.players[(state.askerIndex || 0) % n];
      if (action.type === "ask") {
        if (actorPid !== asker.id) return state;
        const tid = action.payload?.targetId;
        if (!tid || tid === asker.id || !room.players.some((p) => p.id === tid)) return state;
        recordDrawn(room, action.payload?.poolKey, action.payload?.index, action.payload?.poolSize);
        return { ...state, prompt: String(action.payload?.prompt || ""), targetId: tid, revealed: false };
      }
      if (action.type === "flipCoin" && isHost) return { ...state, revealed: !!action.payload?.revealed };
      if (action.type === "next" && isHost) {
        return { ...state, askerIndex: (state.askerIndex + 1) % n, prompt: null, targetId: null, revealed: false };
      }
      return state;
    }
    case "spin-the-bottle": {
      if (action.type === "spin" && isHost) {
        const picker = Math.floor(Math.random() * n);
        let target = Math.floor(Math.random() * n);
        if (n > 1) while (target === picker) target = Math.floor(Math.random() * n);
        return { spinning: true, pickerIndex: picker, targetIndex: target, seed: Date.now() };
      }
      if (action.type === "settle" && isHost) return { ...state, spinning: false };
      return state;
    }
    case "two-truths-and-a-lie": {
      const teller = room.players[(state.turnIndex || 0) % n];
      if (action.type === "submit") {
        if (actorPid !== teller.id) return state;
        const st = action.payload?.statements;
        if (!Array.isArray(st) || st.length !== 3) return state;
        const normalized = st.map((s) => ({ text: String(s?.text || "").slice(0, 160), isLie: !!s?.isLie }));
        if (normalized.filter((s) => s.isLie).length !== 1) return state;
        return { ...state, statements: normalized, votes: {}, revealedLie: null };
      }
      if (action.type === "vote") {
        if (actorPid === teller.id) return state;
        const idx = action.payload?.index;
        if (![0, 1, 2].includes(idx)) return state;
        return { ...state, votes: { ...state.votes, [actorPid]: idx } };
      }
      if (action.type === "reveal" && isHost) {
        const idx = state.statements?.findIndex((s) => s.isLie);
        if (idx == null || idx < 0) return state;
        return { ...state, revealedLie: idx };
      }
      if (action.type === "next" && isHost) {
        return { ...state, turnIndex: (state.turnIndex + 1) % n, statements: null, votes: {}, revealedLie: null };
      }
      return state;
    }
    case "hot-seat": {
      if (action.type === "reveal" && isHost) {
        recordDrawn(room, action.payload?.poolKey, action.payload?.index, action.payload?.poolSize);
        return { ...state, prompt: String(action.payload?.prompt || "") };
      }
      if (action.type === "nextVictim" && isHost) {
        return { ...state, victimIndex: (state.victimIndex + 1) % n, prompt: null };
      }
      return state;
    }
    case "kiss-marry-avoid": {
      const current = room.players[(state.turnIndex || 0) % n];
      if (action.type === "reveal") {
        if (actorPid !== current.id) return state;
        const opts = action.payload?.options;
        if (!Array.isArray(opts) || opts.length !== 3) return state;
        recordDrawn(room, action.payload?.poolKey, action.payload?.index, action.payload?.poolSize);
        return { ...state, options: opts.map(String), choices: {} };
      }
      if (action.type === "choose") {
        const m = action.payload?.mapping;
        if (!m || typeof m !== "object") return state;
        const vals = Object.values(m);
        if (vals.length !== 3) return state;
        const set = new Set(vals);
        if (set.size !== 3) return state;
        for (const v of vals) if (!["kiss", "marry", "avoid"].includes(v)) return state;
        return { ...state, choices: { ...state.choices, [actorPid]: m } };
      }
      if (action.type === "next" && isHost) {
        return { ...state, turnIndex: (state.turnIndex + 1) % n, options: null, choices: {} };
      }
      return state;
    }
    default:
      return state;
  }
}
