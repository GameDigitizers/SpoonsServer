<script>
  import { avatarName, imageUrl } from '../lib/cards.js';

  let { avatars, send } = $props();
</script>

<div class="picker">
  <h2>Pick your critter</h2>
  <p>This is you on the big screen.</p>
  <ul>
    {#each avatars as avatar (avatar.img)}
      <li>
        <button
          disabled={avatar.takenBy}
          onclick={() => send('choose-avatar', { avatar: avatar.img })}
          aria-label={avatarName(avatar.img)}
        >
          <img src={imageUrl(avatar.img)} alt="" />
        </button>
      </li>
    {/each}
  </ul>
</div>

<style>
  .picker {
    width: 100%;
    max-width: 480px;
    margin: 0 auto;
    padding: 16px;
    text-align: center;
  }

  h2 {
    margin: 8px 0 0;
    font-family: var(--font-display);
    font-size: 1.8rem;
  }

  p {
    margin: 0 0 16px;
  }

  ul {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  button {
    width: 100%;
    aspect-ratio: 1;
    padding: 6px;
    border: 3px solid var(--ink);
    border-radius: 16px;
    background: var(--paper);
    box-shadow: 0 3px 0 var(--ink);
  }

  button:active:not(:disabled) {
    transform: translateY(2px);
    box-shadow: 0 1px 0 var(--ink);
  }

  button:disabled {
    opacity: 0.25;
    box-shadow: none;
    cursor: default;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
</style>
