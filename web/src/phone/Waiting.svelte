<script>
  import { imageUrl } from '../lib/cards.js';

  let { game, send } = $props();

  const me = $derived(game.me);
  const contenders = $derived(game.players.filter((player) => player.avatar));
  const notReady = $derived(contenders.filter((player) => !player.ready));
  const loser = $derived(game.lastRound && game.players.find((p) => p.id === game.lastRound.loserId));
  const roundInProgress = $derived(game.phase === 'play');

  let jumping = $state(false);
  function jump() {
    send('jump');
    jumping = true;
    setTimeout(() => (jumping = false), 400);
  }
</script>

<div class="waiting">
  {#if loser}
    <div class="result" class:lost={loser.id === me.id}>
      {#if loser.id === me.id}
        <h2>You lost this round!</h2>
      {:else}
        <h2>{loser.name} lost this round</h2>
        <img src={imageUrl(loser.avatar)} alt="" />
      {/if}
    </div>
  {/if}

  <button class="me" class:jumping onclick={jump} aria-label="Jump on the big screen">
    <img src={imageUrl(me.avatar)} alt="" />
  </button>
  <p class="name">
    {me.name}
    {#if me.letters}<span class="letters">{'SPOONS'.slice(0, me.letters)}</span>{/if}
  </p>
  <p class="hint">Tap your critter to wave on the big screen.</p>

  {#if roundInProgress}
    <p class="status">A round is in progress. You'll be dealt in next time.</p>
  {/if}

  <button class="big-button" class:go={!me.ready} onclick={() => send('ready', { ready: !me.ready })}>
    {me.ready ? "Wait, I'm not ready" : "I'm ready!"}
  </button>

  {#if !roundInProgress}
    <p class="status">
      {#if contenders.length < 2}
        Waiting for at least one more player…
      {:else if notReady.length}
        Waiting on {notReady.map((player) => player.name || 'someone').join(', ')}
      {:else}
        Dealing!
      {/if}
    </p>
  {/if}
</div>

<style>
  .waiting {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    width: 100%;
    max-width: 420px;
    margin: auto;
    padding: 16px;
    text-align: center;
  }

  .result {
    width: 100%;
    padding: 10px;
    border-radius: 14px;
    background: var(--paper);
  }

  .result.lost {
    background: var(--danger);
    color: white;
  }

  .result h2 {
    margin: 0;
    font-family: var(--font-display);
  }

  .result img {
    height: 60px;
  }

  .me {
    width: 150px;
    height: 150px;
    padding: 0;
    border: none;
    background: none;
  }

  .me img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .jumping {
    animation: jump 0.4s ease-out;
  }

  @keyframes jump {
    50% { transform: translateY(-30px); }
  }

  p {
    margin: 0;
  }

  .name {
    font-size: 1.6rem;
    font-weight: 800;
  }

  .letters {
    margin-left: 8px;
    color: var(--orange);
    font-family: var(--font-display);
    letter-spacing: 0.1em;
  }

  .hint {
    font-size: 0.9rem;
    opacity: 0.7;
  }

  .status {
    font-weight: 600;
  }
</style>
