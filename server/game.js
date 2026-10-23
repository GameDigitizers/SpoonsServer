import chalk from 'chalk';
import { createBehavioralFsm } from 'machina';

import { AVATARS } from './avatars.js';
import { DECK, shuffle } from './cards.js';
import { createPlayer, playerFsm } from './player.js';

const LOBBY_GRACE_MS = 10_000;
const PLAY_GRACE_MS = 60_000;
const HAND_SIZE = 4;
const PLAYER_INPUTS = new Set(['set-name', 'ready', 'draw', 'pass', 'grab-spoon', 'puzzle-done']);

export function createGame(id, io) {
  return {
    id,
    io,
    players: [],
    seats: [], // players dealt into the current round, in passing order
    startingIndex: -1,
    raceOn: false,
    lastRound: null,
  };
}

export const gameFsm = createBehavioralFsm({
  id: 'game',
  initialState: 'lobby',

  states: {
    lobby: {
      _onEnter({ ctx }) {
        ctx.seats = [];
        ctx.raceOn = false;
        ctx.players.forEach((player) => playerFsm.transition(player, 'lobby'));
      },

      'start-check'({ ctx }) {
        const contenders = ctx.players.filter((player) => player.avatar);
        if (contenders.length > 1 && contenders.every((player) => player.ready)) {
          return 'play';
        }
      },

      'remove-player'({ ctx }, player) {
        dropPlayer(ctx, player);
      },
    },

    play: {
      _onEnter({ ctx }) {
        ctx.lastRound = null;
        ctx.seats = ctx.players.filter((player) => player.ready);
        ctx.startingIndex = (ctx.startingIndex + 1) % ctx.seats.length;

        const deck = shuffle(DECK);
        ctx.seats.forEach((player) => {
          playerFsm.transition(player, 'play');
          player.hand = deck.splice(0, HAND_SIZE);
        });
        ctx.seats[ctx.startingIndex].incoming = deck;

        log(ctx, `dealt to ${ctx.seats.length}, ${chalk.bold(ctx.seats[ctx.startingIndex].name)} starts`);
      },

      'round-check'({ ctx }) {
        const needSpoons = ctx.seats.filter((player) => !player.hasSpoon);
        if (needSpoons.length > 1) {
          return;
        }
        // Somebody left and took the round down with them
        if (needSpoons.length === 0 || ctx.seats.length < 2) {
          return 'lobby';
        }
        const [loser] = needSpoons;
        loser.letters++;
        ctx.lastRound = { loserId: loser.id };
        log(ctx, `${chalk.red.bold(loser.name)} lost`);
        return 'lobby';
      },

      'remove-player'({ ctx }, player) {
        if (player.seated) {
          // Don't let their cards vanish from the loop
          nextSeat(ctx, player).incoming.push(...player.hand, ...player.incoming);
          ctx.seats = ctx.seats.filter((seat) => seat !== player);
        }
        dropPlayer(ctx, player);
        return ctx.seats.length < 2 ? 'lobby' : undefined;
      },
    },
  },
});

playerFsm.on('passed', ({ player, card }) => {
  const game = player.game;
  const next = nextSeat(game, player);
  next.incoming.push(card);
  game.io.to(tvRoom(game)).emit('pass', { from: player.id, to: next.id });
});

playerFsm.on('grabbed', ({ player }) => {
  if (!player.game.raceOn) {
    log(player.game, `${chalk.yellow.bold(player.name)} grabbed the first spoon!`);
  }
  player.game.raceOn = true;
});

playerFsm.on('denied', ({ player }) => {
  player.socket?.emit('nope');
});

playerFsm.on('got-spoon', ({ player }) => {
  // Let the player finish transitioning to "safe" before the round can end
  queueMicrotask(() => {
    gameFsm.handle(player.game, 'round-check');
    broadcast(player.game);
  });
});

export function joinGame(game, socket, playerId) {
  let player = game.players.find((p) => p.id === playerId);
  if (!player) {
    player = createPlayer({ id: playerId, game });
    game.players.push(player);
    playerFsm.transition(player, 'lobby');
  }
  clearTimeout(player.leaveTimer);
  const oldSocket = player.socket;
  player.socket = socket;
  oldSocket?.disconnect(true);
  socket.join(game.id);

  socket.onAny((type, msg = {}) => handlePlayerMessage(game, player, type, msg));
  socket.on('disconnect', () => {
    if (player.socket !== socket) {
      return;
    }
    player.socket = null;
    const grace = gameFsm.currentState(game) === 'play' ? PLAY_GRACE_MS : LOBBY_GRACE_MS;
    player.leaveTimer = setTimeout(() => {
      gameFsm.handle(game, 'remove-player', player);
      gameFsm.handle(game, 'round-check');
      broadcast(game);
    }, grace);
    player.leaveTimer.unref?.();
    broadcast(game);
  });

  broadcast(game);
}

export function watchGame(game, socket) {
  socket.join(tvRoom(game));
  broadcast(game);
}

function handlePlayerMessage(game, player, type, msg) {
  switch (type) {
    case 'choose-avatar':
      if (AVATARS.includes(msg.avatar) && !game.players.some((p) => p.avatar === msg.avatar)) {
        player.avatar = msg.avatar;
      }
      break;
    case 'jump':
      game.io.to(tvRoom(game)).emit('jump', { playerId: player.id });
      return;
    default:
      if (!PLAYER_INPUTS.has(type)) {
        return;
      }
      playerFsm.handle(player, type, msg);
  }
  gameFsm.handle(game, 'start-check');
  broadcast(game);
}

function dropPlayer(game, player) {
  game.players = game.players.filter((p) => p !== player);
  log(game, `${player.name || player.id} left`);
}

function nextSeat(game, player) {
  const index = game.seats.indexOf(player);
  return game.seats[(index + 1) % game.seats.length];
}

function previousSeat(game, player) {
  const index = game.seats.indexOf(player);
  return game.seats[(index - 1 + game.seats.length) % game.seats.length];
}

function tvRoom(game) {
  return `${game.id}:tv`;
}

export function isEmpty(game) {
  return game.players.length === 0 && game.io.sockets.adapter.rooms.get(tvRoom(game)) === undefined;
}

function publicPlayer(player) {
  return {
    id: player.id,
    name: player.name,
    avatar: player.avatar,
    ready: player.ready,
    connected: Boolean(player.socket),
    seated: player.seated,
    hasSpoon: player.hasSpoon,
    letters: player.letters,
    incomingCount: player.incoming.length,
  };
}

function publicState(game) {
  return {
    gameId: game.id,
    phase: gameFsm.currentState(game),
    players: game.players.map(publicPlayer),
    seats: game.seats.map((player) => player.id),
    spoonsLeft: Math.max(0, game.seats.length - 1 - game.seats.filter((p) => p.hasSpoon).length),
    lastRound: game.lastRound,
  };
}

function privateState(game, player, shared) {
  const waitingOn = player.seated && player.incoming.length === 0 && player.hand.length < 5
    ? previousSeat(game, player)?.name
    : null;

  // Whether anyone has grabbed a spoon is something you're supposed to notice
  // at the table, so only the TV's dwindling spoon count gives it away
  const inPlay = shared.phase === 'play';
  return {
    ...shared,
    spoonsLeft: undefined,
    players: inPlay ? shared.players.map(({ hasSpoon, ...rest }) => rest) : shared.players,
    me: {
      ...publicPlayer(player),
      state: playerFsm.currentState(player),
      hand: player.hand,
      drawnId: player.drawnId,
      waitingOn,
    },
    avatars: AVATARS.map((img) => ({
      img,
      takenBy: game.players.find((p) => p.avatar === img)?.id ?? null,
    })),
  };
}

export function broadcast(game) {
  const shared = publicState(game);
  game.io.to(tvRoom(game)).emit('state', shared);
  game.players.forEach((player) => {
    player.socket?.emit('state', privateState(game, player, shared));
  });
}

function log(game, message) {
  console.log(chalk.cyan(`[${game.id}]`), message);
}
