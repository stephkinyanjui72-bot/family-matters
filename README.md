# Family Matters — Party Games

A LAN party-game web app. One phone/laptop hosts, everyone else scans a QR code to join. Works on iOS, Android, and desktop browsers.

---

## Quick start (first time)

Open a terminal in `D:\family matters` and run:

```bash
npm install
npm run dev
```

You'll see output like:

```
Party app ready
  - Local:   http://localhost:3000
  - Network: http://192.168.100.63:3000
```

- **Local** → open on the host machine
- **Network** → the URL phones on the same WiFi will hit

Leave the terminal open while you play. `Ctrl+C` stops the server.

---

## How to play

### 1. Host a party
1. On the **host device** (laptop or one phone), open `http://localhost:3000` (or the Network URL from another device).
2. Tap **Host a Party**.
3. Enter your name and pick an intensity tier:
   - 🟢 **Mild** — safe for any crowd
   - 🌶️ **Spicy** — flirty, 18+ recommended
   - 🔥 **Extreme** — no limits, adults only
   - 💀 **Chaos 23+** — unfiltered and intimate (age-gate confirmation required)
4. Tap **Start**. You'll get a 4-letter room code + QR code.

### 2. Join from other phones
All players must be on the **same WiFi** as the host.

- **Scan the QR code** with the phone camera → browser opens the join page.
- Or manually type the Network URL into the browser, then enter the room code.
- Enter your name and tap **Join**.

### 3. Start a game
The host picks a game from the grid. The screen switches on every device simultaneously.

Available games:
1. 🎯 Truth or Dare
2. 🥃 Do or Drink
3. ✋ Never Have I Ever
4. 🫵 Most Likely To
5. ⚖️ Would You Rather
6. 🤫 Paranoia
7. 🍾 Spin the Bottle
8. 🕵️ Two Truths & a Lie
9. 🔥 Hot Seat
10. 💋 Kiss / Marry / Avoid

The **host runs the round** (reveals, turns, next). Players vote / submit on their own phones.

Tap **Exit** (top-right, host only) to return to the lobby and pick another game.

---

## Install as an app (optional)

On any device, open the app URL in the browser, then:

- **iOS Safari** → Share → *Add to Home Screen*
- **Android Chrome** → menu (⋮) → *Install app* / *Add to Home screen*

Launches fullscreen with no browser bars — looks and feels like a native app.

---

## Troubleshooting

**Phones can't load the Network URL**
- Confirm the host and the phones are all on the **same WiFi network** (not one on 5 GHz and another on guest SSID).
- Windows Firewall may block port 3000 the first time. When the prompt appears, allow **Private networks**.
- Router "client isolation" / "AP isolation" blocks device-to-device traffic — disable it in the router settings if it's on.

**Wrong IP in the QR code**
The server prefers Wi-Fi interfaces, but if yours is misnamed:
```bash
LAN_IP=192.168.100.63 npm run dev
```
Replace with your actual Wi-Fi IP (find it in Windows: `ipconfig` → "IPv4 Address" under your Wi-Fi adapter).

**Port 3000 already in use**
```bash
PORT=4000 npm run dev
```

**Socket keeps disconnecting**
Phones sleeping/locking will drop the connection. Unlocking reconnects automatically.

---

## Production build (optional)

To run the optimized build:

```bash
npm run build
npm start
```

Same `http://<your-ip>:3000` URL, just faster.

---

## Project layout

```
server.js                        custom Node server (Next + Socket.io)
src/
  app/
    page.tsx                     landing (host / join)
    room/[code]/page.tsx         lobby + QR code + game grid
  components/
    GameScreen.tsx               routes to the active game
    games/                       one component per game
  lib/
    store.tsx                    client-side socket store
    content/                     prompt packs per game, per intensity
    games.ts                     game metadata
    types.ts                     shared types
```

Add a new game: drop a component in `src/components/games/`, a reducer branch in `server.js` under `reduceGame`, metadata in `src/lib/games.ts`, and content in `src/lib/content/`.
