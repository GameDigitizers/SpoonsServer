<script>
  // Tap numbered dots in order. Each solved puzzle adds a dot, and you're done
  // once a puzzle has as many dots as there are players at the table.
  let { seatCount, onDone } = $props();

  const GRID = 3;
  const target = $derived(Math.min(GRID * GRID, Math.max(2, seatCount)));

  let length = $state(2);
  let next = $state(0);
  let dots = $state(layout(2));
  let missed = $state(false);

  function layout(count) {
    const cells = [];
    for (let row = 0; row < GRID; row++) {
      for (let col = 0; col < GRID; col++) {
        cells.push({ row, col });
      }
    }
    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cells[i], cells[j]] = [cells[j], cells[i]];
    }
    return cells.slice(0, count);
  }

  function tap(index) {
    if (index < next) {
      return;
    }
    if (index > next) {
      missed = true;
      setTimeout(() => (missed = false), 300);
      next = 0;
      dots = layout(length);
      return;
    }
    next++;
    if (next < length) {
      return;
    }
    if (length >= target) {
      onDone();
      return;
    }
    length++;
    next = 0;
    dots = layout(length);
  }
</script>

<div class="puzzle" class:missed>
  <p class="help">Tap the dots in order to grab a spoon!</p>
  <div class="grid">
    {#each dots as dot, index (`${length}-${dot.row}-${dot.col}`)}
      <button
        class="dot"
        class:done={index < next}
        style:grid-row={dot.row + 1}
        style:grid-column={dot.col + 1}
        onpointerdown={() => tap(index)}
      >
        {index + 1}
      </button>
    {/each}
  </div>
  <p class="progress">{length - 1} of {target - 1}</p>
</div>

<style>
  .puzzle {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 16px;
    background: var(--plum);
    color: white;
    touch-action: none;
  }

  .missed {
    animation: shake 0.3s;
  }

  .help {
    margin: 0;
    font-family: var(--font-display);
    font-size: 1.4rem;
    text-align: center;
  }

  .grid {
    flex: 1;
    display: grid;
    grid-template: repeat(3, 1fr) / repeat(3, 1fr);
    place-items: center;
  }

  .dot {
    width: clamp(64px, 22vw, 110px);
    height: clamp(64px, 22vw, 110px);
    border: 4px solid var(--ink);
    border-radius: 50%;
    background: var(--gold);
    color: var(--ink);
    font-size: 2rem;
    font-weight: 800;
    animation: pop 0.15s ease-out;
  }

  .dot.done {
    background: var(--ok);
    color: white;
  }

  @keyframes pop {
    from { transform: scale(0.4); }
  }

  .progress {
    margin: 0;
    text-align: center;
    opacity: 0.8;
  }
</style>
