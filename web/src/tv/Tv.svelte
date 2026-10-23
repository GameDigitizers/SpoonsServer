<script>
  import { io } from 'socket.io-client';
  import { onDestroy } from 'svelte';
  import { scale } from 'svelte/transition';

  import { CARD_BACK, SPOON, imageUrl } from '../lib/cards.js';
  import JoinCard from './JoinCard.svelte';
  import Spoons from './Spoons.svelte';

  let { gameId } = $props();

  // Everything is drawn in a fixed 1600x900 space and scaled to the screen
  const W = 1600;
  const H = 900;
  const CX = W / 2;
  const CY = H / 2;
  const RX = 650;
  const RY = 330;
  const CARD_W = 44;
  const CARD_H = 64;

  let game = $state(null);
  let flights = $state([]);
  let jumping = $state({});
  let flightId = 0;

  const socket = io();
  socket.on('connect', () => socket.emit('watch', { gameId }));
  socket.on('state', (state) => (game = state));
  socket.on('pass', ({ from, to }) => {
    const a = seatsById[from];
    const b = seatsById[to];
    if (a && b) {
      flights.push({ id: flightId++, from: a.stack, to: b.stack });
    }
  });
  socket.on('jump', ({ playerId }) => {
    jumping[playerId] = true;
    setTimeout(() => (jumping[playerId] = false), 450);
  });
  onDestroy(() => socket.disconnect());

  const playing = $derived(game?.phase === 'play');

  // In the lobby show everyone who has picked a critter; during a round, the dealt seats in passing order
  const shown = $derived.by(() => {
    if (!game) {
      return [];
    }
    if (playing) {
      return game.seats.map((id) => game.players.find((p) => p.id === id)).filter(Boolean);
    }
    return game.players.filter((p) => p.avatar);
  });

  const avatarSize = $derived(Math.max(90, Math.min(170, 2200 / Math.max(shown.length, 1))));

  // Seats go clockwise around an ellipse starting at the top
  const layout = $derived(
    shown.map((player, index) => {
      const angle = -Math.PI / 2 + (2 * Math.PI * index) / shown.length;
      const x = CX + RX * Math.cos(angle);
      const y = CY + RY * Math.sin(angle);
      // Each draw pile sits just inside the seat, toward the middle of the table
      const toCenter = Math.hypot(CX - x, CY - y) || 1;
      const reach = avatarSize / 2 + 115; // clears the name label under the avatar
      const stack = {
        x: x + ((CX - x) / toCenter) * reach - CARD_W / 2,
        y: y + ((CY - y) / toCenter) * reach - CARD_H / 2,
      };
      return { player, x, y, stack };
    }),
  );

  const seatsById = $derived(Object.fromEntries(layout.map((seat) => [seat.player.id, seat])));
  const loser = $derived(!playing && game?.lastRound && game.players.find((p) => p.id === game.lastRound.loserId));

  function fly(node, { from, to, id }) {
    const animation = node.animate(
      [
        { transform: `translate(${from.x}px, ${from.y}px)` },
        { transform: `translate(${to.x}px, ${to.y}px)` },
      ],
      { duration: 380, easing: 'ease-in-out', fill: 'forwards' },
    );
    animation.onfinish = () => (flights = flights.filter((flight) => flight.id !== id));
  }
</script>

<div class="tv">
  <svg viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid meet">
    <ellipse cx={CX} cy={CY} rx={RX - 70} ry={RY - 60} class="felt" />

    {#if playing}
      <Spoons count={game.spoonsLeft} cx={CX} cy={CY} rx={RX - 260} ry={RY - 180} />
    {/if}

    {#each layout as { player, x, y, stack } (player.id)}
      {@const size = avatarSize}
      <g class="seat" class:away={!player.connected}>
        {#if playing}
          {#each { length: Math.min(player.incomingCount, 14) } as _, i}
            <image href={CARD_BACK} x={stack.x + i * 1.5} y={stack.y - i * 2.5} width={CARD_W} height={CARD_H} />
          {/each}
          {#if player.incomingCount > 0}
            <text class="count" x={stack.x + CARD_W / 2} y={stack.y + CARD_H + 22}>{player.incomingCount}</text>
          {/if}
        {/if}

        <g class="avatar" class:jumping={jumping[player.id]} style="transform-origin: {x}px {y}px">
          <image href={imageUrl(player.avatar)} x={x - size / 2} y={y - size / 2} width={size} height={size} />
        </g>

        {#if player.hasSpoon}
          <image class="won-spoon" href={SPOON} x={x + size / 2 - 10} y={y - size / 2} width={24} height={58} />
        {/if}

        {#if !playing && player.ready}
          <g class="ready">
            <circle cx={x - size / 2 + 12} cy={y - size / 2 + 12} r="16" />
            <text x={x - size / 2 + 12} y={y - size / 2 + 19}>✓</text>
          </g>
        {/if}

        <text class="name" x={x} y={y + size / 2 + 26}>{player.name}</text>
        {#if player.letters}
          <text class="letters" x={x} y={y + size / 2 + 56}>{'SPOONS'.slice(0, player.letters)}</text>
        {/if}
      </g>
    {/each}

    {#each flights as flight (flight.id)}
      <image use:fly={flight} href={CARD_BACK} x="0" y="0" width={CARD_W} height={CARD_H} />
    {/each}
  </svg>

  {#if game && !playing}
    <div class="center">
      {#if loser}
        <div class="loser" in:scale={{ duration: 400, start: 0.3 }}>
          <img src={imageUrl(loser.avatar)} alt="" />
          <p class="logo">{loser.name} lost!</p>
        </div>
      {/if}
      <JoinCard {gameId} compact={Boolean(loser) || shown.length > 0} />
    </div>
  {/if}

  {#if !game}
    <p class="center connecting">Setting the table…</p>
  {/if}
</div>

<style>
  .tv {
    position: relative;
    height: 100dvh;
    overflow: hidden;
    background: var(--butter);
  }

  svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .felt {
    fill: var(--felt);
    stroke: var(--felt-dark);
    stroke-width: 14;
  }

  .seat {
    transition: opacity 0.3s;
  }

  .seat.away {
    opacity: 0.35;
  }

  .avatar {
    transition: transform 0.2s;
  }

  .avatar.jumping {
    animation: jump 0.45s ease-out;
  }

  @keyframes jump {
    50% { transform: translateY(-40px); }
  }

  text {
    text-anchor: middle;
    font-family: var(--font-body);
  }

  .name {
    font-size: 26px;
    font-weight: 800;
    fill: var(--ink);
  }

  .letters {
    font-family: var(--font-display);
    font-size: 26px;
    fill: var(--orange);
    letter-spacing: 4px;
  }

  .count {
    font-size: 20px;
    font-weight: 800;
    fill: white;
  }

  .ready circle {
    fill: var(--ok);
    stroke: white;
    stroke-width: 3;
  }

  .ready text {
    fill: white;
    font-size: 20px;
    font-weight: 800;
  }

  .won-spoon {
    transform-box: fill-box;
    transform-origin: center;
    transform: rotate(20deg);
  }

  .center {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4vw;
    pointer-events: none;
  }

  .connecting {
    font-size: 2rem;
    color: var(--ink);
  }

  .loser {
    text-align: center;
  }

  .loser img {
    height: 22vh;
  }

  .loser .logo {
    font-size: 5vh;
    color: var(--gold);
  }
</style>
