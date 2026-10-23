<script>
  import { SPOON } from '../lib/cards.js';

  // Spoons drift around the middle of the table, spinning, until someone grabs one
  let { count, cx, cy, rx, ry } = $props();

  const SIZE = 36;

  function randomSpot() {
    const angle = Math.random() * Math.PI * 2;
    const reach = Math.sqrt(Math.random());
    return { x: cx + rx * reach * Math.cos(angle), y: cy + ry * reach * Math.sin(angle) };
  }

  let spoons = $state([]);

  // Keep one entry per spoon still on the table, retaining existing ones so they don't jump
  $effect(() => {
    if (spoons.length > count) {
      spoons = spoons.slice(0, count);
    }
    while (spoons.length < count) {
      spoons.push({ ...randomSpot(), spin: 0.6 + Math.random() * 2.4, reverse: Math.random() < 0.5 });
    }
  });

  $effect(() => {
    const timer = setInterval(() => {
      spoons.forEach((spoon) => Object.assign(spoon, randomSpot()));
    }, 2000);
    return () => clearInterval(timer);
  });
</script>

{#each spoons as spoon, i (i)}
  <g class="spoon" style="transform: translate({spoon.x - SIZE / 2}px, {spoon.y - SIZE}px)">
    <image
      href={SPOON}
      width={SIZE}
      height={SIZE * 2.4}
      style="animation-duration: {spoon.spin}s; animation-direction: {spoon.reverse ? 'reverse' : 'normal'}"
    />
  </g>
{/each}

<style>
  .spoon {
    transition: transform 2s linear;
  }

  image {
    transform-box: fill-box;
    transform-origin: center;
    animation: spin linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
