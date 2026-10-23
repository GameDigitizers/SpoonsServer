# Spoons

[Spoons](https://bicyclecards.com/how-to-play/spoons) for a room full of people: one shared screen (TV, projector, a cast Chrome tab) shows the table, and everyone holds their hand on their phone.

House rules: there's no discard pile. Cards loop around the table forever, so the last player passes back to the dealer. Instead of lunging for a real spoon, you race to tap a dot puzzle on your phone. The puzzle gets longer the more players there are. Each round's loser earns a letter of S-P-O-O-N-S.

## Running it

```sh
npm install
npm run dev      # game server on :3339, Vite dev server on :3340
```

- Table: open `http://localhost:3340/tv/<game-name>` on the big screen. It shows a QR code and the LAN address for phones.
- Phones: scan the code, or open `http://<your-ip>:3340/<game-name>`.
- `http://localhost:3340/` lets you pick a game name and choose phone or table.

For a single-process build: `npm run build && npm start` (serves everything on :3339, or `$PORT`).

`npm test` plays a scripted round through the real socket server.

## Layout

- `server/index.js`: Express and socket.io. It maps game names to games. Phones send `join`, TVs send `watch`.
- `server/game.js`: the game state machine (`lobby` → `play` → `lobby`), passing, the spoon race, and the state broadcast to phones and the TV.
- `server/player.js`: the per-player state machine (`lobby` → `play` → `racing` → `safe`).
- `web/src/phone/`: the phone (Svelte). Name, then critter, then ready, then hand, then dot puzzle.
- `web/src/tv/`: the table (Svelte + SVG). Seats around the felt, draw piles, flying cards, drifting spoons.

The server is authoritative. After every change it sends each phone its own view (`state`), and sends the TV a public view plus `pass` and `jump` events for animation. The phone isn't told that a race has started. The vanishing spoons on the TV are the only tell, just like at a real table.
