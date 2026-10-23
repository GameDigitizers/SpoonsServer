import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

import { io as connect } from 'socket.io-client';

import { startServer } from './index.js';

let server;
const sockets = [];

before(async () => {
  server = await startServer({ port: 0 });
});

after(() => {
  sockets.forEach((socket) => socket.disconnect());
  server.io.close();
});

// Resolves with the next 'state' that satisfies the predicate
function nextState(client, predicate = () => true) {
  return new Promise((resolve) => {
    const check = (state) => {
      if (predicate(state)) {
        client.socket.off('state', check);
        resolve(state);
      }
    };
    client.socket.on('state', check);
  });
}

function open() {
  const socket = connect(`http://localhost:${server.port}`, { forceNew: true });
  sockets.push(socket);
  return socket;
}

async function joinPlayer(gameId, name, avatar) {
  const client = { socket: open() };
  const joined = nextState(client);
  client.socket.emit('join', { gameId, playerId: `${name}-id` });
  await joined;
  client.socket.emit('set-name', { name });
  client.socket.emit('choose-avatar', { avatar });
  await nextState(client, (s) => s.me.avatar === avatar);
  return client;
}

const totalCards = (game) => game.seats.reduce((n, p) => n + p.hand.length + p.incoming.length, 0);

test('a full round: deal, pass around the loop, race for spoons, pick a loser', async () => {
  const gameId = 'kitchen';
  const tv = { socket: open() };
  const tvPasses = [];
  tv.socket.on('pass', (pass) => tvPasses.push(pass));
  tv.socket.emit('watch', { gameId });

  const ann = await joinPlayer(gameId, 'Ann', 'owl.png');
  const bo = await joinPlayer(gameId, 'Bo', 'pig.png');
  const cy = await joinPlayer(gameId, 'Cy', 'cow.png');

  // Taken avatars can't be stolen
  bo.socket.emit('choose-avatar', { avatar: 'owl.png' });
  const stillPig = await nextState(bo);
  assert.equal(stillPig.me.avatar, 'pig.png');

  ann.socket.emit('ready', { ready: true });
  bo.socket.emit('ready', { ready: true });
  await nextState(bo, (s) => s.players.filter((p) => p.ready).length === 2);
  const game = server.games.get(gameId);
  assert.equal(game.seats.length, 0, 'waits for everyone with an avatar');

  const playing = nextState(tv, (s) => s.phase === 'play');
  cy.socket.emit('ready', { ready: true });
  const tvState = await playing;
  assert.equal(tvState.seats.length, 3);
  assert.equal(tvState.spoonsLeft, 2);

  assert.equal(totalCards(game), 52);
  game.seats.forEach((p) => assert.equal(p.hand.length, 4));
  const dealer = game.seats[game.startingIndex];
  assert.equal(dealer.incoming.length, 52 - 12);

  // The dealer draws and passes to the next seat; the last seat passes back to the dealer
  const clients = { 'Ann-id': ann, 'Bo-id': bo, 'Cy-id': cy };
  const dealerClient = clients[dealer.id];
  dealerClient.socket.emit('draw');
  const drawn = await nextState(dealerClient, (s) => s.me.hand.length === 5);
  dealerClient.socket.emit('pass', { cardId: drawn.me.drawnId });
  await nextState(dealerClient, (s) => s.me.hand.length === 4);

  const second = game.seats[(game.startingIndex + 1) % 3];
  const third = game.seats[(game.startingIndex + 2) % 3];
  assert.equal(second.incoming.length, 1);
  assert.deepEqual(tvPasses.at(-1), { from: dealer.id, to: second.id });

  clients[second.id].socket.emit('draw');
  const secondDrawn = await nextState(clients[second.id], (s) => s.me.hand.length === 5);
  clients[second.id].socket.emit('pass', { cardId: secondDrawn.me.hand[0].id });
  await nextState(clients[second.id], (s) => s.me.hand.length === 4);

  clients[third.id].socket.emit('draw');
  const thirdDrawn = await nextState(clients[third.id], (s) => s.me.hand.length === 5);
  clients[third.id].socket.emit('pass', { cardId: thirdDrawn.me.drawnId });
  await nextState(clients[third.id], (s) => s.me.hand.length === 4);
  assert.equal(dealer.incoming.length, 52 - 12 - 1 + 1, 'the loop wraps back to the dealer');
  assert.equal(totalCards(game), 52);

  // You can't grab a spoon without four of a kind...
  const handWithoutFour = [
    { id: '2c', value: '2' }, { id: '3c', value: '3' }, { id: '4c', value: '4' }, { id: '5c', value: '5' },
  ];
  second.hand = handWithoutFour;
  const nope = new Promise((resolve) => clients[second.id].socket.once('nope', resolve));
  clients[second.id].socket.emit('grab-spoon');
  await nope;

  // ...but once you have it you can, and then everyone else may join the race
  second.hand = ['c', 'd', 'h', 's'].map((suit) => ({ id: `k${suit}`, value: 'king' }));
  clients[second.id].socket.emit('grab-spoon');
  await nextState(clients[second.id], (s) => s.me.state === 'racing');
  assert.equal(game.raceOn, true);

  third.hand = handWithoutFour;
  clients[third.id].socket.emit('grab-spoon');
  await nextState(clients[third.id], (s) => s.me.state === 'racing');

  clients[third.id].socket.emit('puzzle-done');
  const oneSpoonLeft = await nextState(tv, (s) => s.spoonsLeft === 1);
  assert.equal(oneSpoonLeft.phase, 'play');

  const roundOver = nextState(tv, (s) => s.phase === 'lobby');
  clients[second.id].socket.emit('puzzle-done');
  const results = await roundOver;
  assert.deepEqual(results.lastRound, { loserId: dealer.id });
  assert.equal(results.players.find((p) => p.id === dealer.id).letters, 1);
  assert.ok(results.players.every((p) => !p.ready && !p.seated));
});

test('a player who reconnects with the same id keeps their seat', async () => {
  const gameId = 'reconnect';
  const ann = await joinPlayer(gameId, 'Ann', 'owl.png');
  const bo = await joinPlayer(gameId, 'Bo', 'pig.png');
  ann.socket.emit('ready', { ready: true });
  bo.socket.emit('ready', { ready: true });
  await nextState(ann, (s) => s.phase === 'play');

  const game = server.games.get(gameId);
  const handBefore = game.players.find((p) => p.id === 'Ann-id').hand.map((c) => c.id);
  ann.socket.disconnect();

  const again = { socket: open() };
  const rejoined = nextState(again);
  again.socket.emit('join', { gameId, playerId: 'Ann-id' });
  const state = await rejoined;
  assert.equal(state.phase, 'play');
  assert.deepEqual(state.me.hand.map((c) => c.id), handBefore);
  assert.equal(state.players.length, 2);
});
