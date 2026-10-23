import { createServer } from 'node:http';
import { networkInterfaces } from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import chalk from 'chalk';
import express from 'express';
import { Server } from 'socket.io';

import { broadcast, createGame, isEmpty, joinGame, watchGame } from './game.js';

const DIST = fileURLToPath(new URL('../dist', import.meta.url));

export function startServer({ port = 3339, serveStatic = false } = {}) {
  const app = express();
  const http = createServer(app);
  const io = new Server(http);
  const games = new Map(); // gameId -> game

  function gameFor(gameId) {
    const id = String(gameId || '').trim().toLowerCase().slice(0, 40);
    if (!id) {
      return null;
    }
    if (!games.has(id)) {
      console.log(chalk.green('New game'), chalk.cyan.bold(id));
      games.set(id, createGame(id, io));
    }
    return games.get(id);
  }

  io.on('connection', (socket) => {
    // Phones send a per-tab id so a reload or a sleepy phone gets its seat back
    socket.once('join', ({ gameId, playerId } = {}) => {
      const game = gameFor(gameId);
      if (game && playerId) {
        joinGame(game, socket, String(playerId));
        socket.on('disconnect', () => forgetIfEmpty(game));
      }
    });

    socket.once('watch', ({ gameId } = {}) => {
      const game = gameFor(gameId);
      if (game) {
        watchGame(game, socket);
        socket.on('disconnect', () => {
          broadcast(game);
          forgetIfEmpty(game);
        });
      }
    });
  });

  function forgetIfEmpty(game) {
    // Players linger for a grace period after disconnecting, so check back later
    setTimeout(() => {
      if (isEmpty(game) && games.get(game.id) === game) {
        games.delete(game.id);
        console.log(chalk.gray('Forgot empty game'), game.id);
      }
    }, 120_000).unref();
  }

  // Lets the TV show a join address that phones on the same Wi-Fi can reach
  app.get('/api/addresses', (req, res) => {
    const addresses = Object.values(networkInterfaces())
      .flat()
      .filter((iface) => iface.family === 'IPv4' && !iface.internal)
      .map((iface) => iface.address);
    res.json({ addresses });
  });

  if (serveStatic) {
    app.use(express.static(DIST));
    app.get('/{*splat}', (req, res) => res.sendFile(path.join(DIST, 'index.html')));
  }

  return new Promise((resolve) => {
    http.listen(port, () => resolve({ http, io, games, port: http.address().port }));
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const production = process.env.NODE_ENV === 'production';
  const port = Number(process.env.PORT) || 3339;
  await startServer({ port, serveStatic: production });
  console.log(`listening on *:${port}` + (production ? '' : ' (run vite for the web app)'));
}
