<script>
  import { CARD_BACK, SPOON, imageUrl } from '../lib/cards.js';

  let { me, send, denied } = $props();

  const drawn = $derived(me.hand.find((card) => card.id === me.drawnId));
  const kept = $derived(me.hand.filter((card) => card.id !== me.drawnId));
  const holding = $derived(Boolean(drawn));

  // Replay the shake each time the server says "no spoon for you"
  let shaking = $state(false);
  $effect(() => {
    if (denied) {
      shaking = true;
      const timer = setTimeout(() => (shaking = false), 450);
      return () => clearTimeout(timer);
    }
  });

  const pass = (card) => send('pass', { cardId: card.id });
</script>

<div class="table">
  <header>
    <img class="avatar" src={imageUrl(me.avatar)} alt="" />
    <span class="name">{me.name}</span>
    <button class="spoon" class:shaking onclick={() => send('grab-spoon')} aria-label="Grab a spoon">
      <img src={SPOON} alt="" />
    </button>
  </header>

  <div class="middle">
    {#if drawn}
      <button class="drawn" onclick={() => pass(drawn)} aria-label="Pass this card">
        <img class="card-img" src={imageUrl(drawn.src)} alt={`${drawn.value} of ${drawn.suit}`} />
      </button>
      <p class="hint">Tap it to pass it on, or tap a card below to swap it out</p>
    {:else if me.incomingCount > 0}
      <button class="pile" onclick={() => send('draw')} aria-label="Draw a card">
        <img class="card-img" src={CARD_BACK} alt="" />
        <span class="count">{me.incomingCount}</span>
      </button>
      <p class="hint">Tap to draw</p>
    {:else}
      <div class="pile empty"></div>
      <p class="hint">Waiting on {me.waitingOn ?? 'the next card'}…</p>
    {/if}
  </div>

  <div class="hand" class:choosing={holding}>
    {#each kept as card (card.id)}
      <button disabled={!holding} onclick={() => pass(card)} aria-label={`Pass the ${card.value} of ${card.suit}`}>
        <img class="card-img" src={imageUrl(card.src)} alt="" />
      </button>
    {/each}
  </div>
</div>

<style>
  .table {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: radial-gradient(ellipse at center, var(--felt), var(--felt-dark));
    color: white;
  }

  header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
  }

  .avatar {
    width: 44px;
    height: 44px;
    object-fit: contain;
  }

  .name {
    flex: 1;
    font-weight: 800;
    font-size: 1.2rem;
  }

  .spoon {
    width: 64px;
    height: 64px;
    border: 3px solid var(--ink);
    border-radius: 50%;
    background: var(--gold);
    box-shadow: 0 3px 0 var(--ink);
  }

  .spoon img {
    height: 44px;
    transform: rotate(30deg);
  }

  .spoon.shaking {
    animation: shake 0.45s;
    background: var(--danger);
  }

  .middle {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 0 16px;
  }

  .middle button {
    padding: 0;
    border: none;
    background: none;
  }

  .drawn .card-img,
  .pile .card-img,
  .pile.empty {
    height: min(48dvh, 110vw);
  }

  .drawn {
    animation: deal 0.18s ease-out;
  }

  @keyframes deal {
    from { transform: translateY(-30px) scale(0.9); opacity: 0; }
  }

  .pile {
    position: relative;
  }

  .pile.empty {
    aspect-ratio: var(--card-ratio);
    border: 3px dashed rgb(255 255 255 / 0.4);
    border-radius: 6%;
  }

  .count {
    position: absolute;
    right: -10px;
    top: -10px;
    min-width: 40px;
    padding: 4px 8px;
    border: 3px solid var(--ink);
    border-radius: 20px;
    background: var(--gold);
    color: var(--ink);
    font-weight: 800;
    font-size: 1.1rem;
  }

  .hint {
    margin: 0;
    text-align: center;
    opacity: 0.85;
  }

  .hand {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    padding: 12px 12px 18px;
  }

  .hand button {
    padding: 0;
    border: none;
    background: none;
    transition: transform 0.15s;
  }

  .hand button:disabled {
    cursor: default;
  }

  .hand .card-img {
    width: 100%;
    height: auto;
  }

  .choosing button {
    transform: translateY(-6px);
  }

  .choosing button:active {
    transform: translateY(-14px);
  }
</style>
