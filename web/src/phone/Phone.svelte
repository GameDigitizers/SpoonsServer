<script>
  import { io } from 'socket.io-client';
  import { onDestroy } from 'svelte';

  import { playerIdFor } from '../lib/storage.js';
  import AvatarPicker from './AvatarPicker.svelte';
  import Hand from './Hand.svelte';
  import NameForm from './NameForm.svelte';
  import Puzzle from './Puzzle.svelte';
  import Waiting from './Waiting.svelte';

  let { gameId } = $props();

  let game = $state(null);
  let connected = $state(false);
  let denied = $state(0); // bumps each time the server refuses a spoon grab

  const socket = io();
  socket.on('connect', () => {
    connected = true;
    socket.emit('join', { gameId, playerId: playerIdFor(gameId) });
  });
  socket.on('disconnect', () => (connected = false));
  socket.on('state', (state) => (game = state));
  socket.on('nope', () => denied++);

  onDestroy(() => socket.disconnect());

  const send = (type, msg) => socket.emit(type, msg);
  const me = $derived(game?.me);
</script>

<div class="phone">
  {#if !connected}
    <p class="banner">Reconnecting…</p>
  {/if}

  {#if !me}
    <p class="loading">Finding the table…</p>
  {:else if !me.name}
    <NameForm {gameId} {send} />
  {:else if !me.avatar}
    <AvatarPicker avatars={game.avatars} {send} />
  {:else if me.state === 'play'}
    <Hand {me} {send} {denied} />
  {:else if me.state === 'racing'}
    <Puzzle seatCount={game.seats.length} onDone={() => send('puzzle-done')} />
  {:else if me.state === 'safe'}
    <div class="center">
      <img class="spoon-won" src="/images/spoon.png" alt="" />
      <h2>You got a spoon!</h2>
      <p>Sit tight while everyone else scrambles.</p>
    </div>
  {:else}
    <Waiting {game} {send} />
  {/if}
</div>

<style>
  .phone {
    height: 100%;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
  }

  .banner {
    margin: 0;
    padding: 6px;
    background: var(--danger);
    color: white;
    text-align: center;
    font-weight: 800;
  }

  .loading {
    margin: auto;
  }

  .center {
    margin: auto;
    padding: 16px;
    text-align: center;
  }

  .spoon-won {
    height: 160px;
    animation: shake 0.6s ease 2;
  }
</style>
