<script>
  import { load, save } from '../lib/storage.js';

  let { gameId, send } = $props();

  let name = $state(load(localStorage, 'spoons:name') ?? '');

  function submit(event) {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed) {
      save(localStorage, 'spoons:name', trimmed);
      send('set-name', { name: trimmed });
    }
  }
</script>

<form onsubmit={submit}>
  <h1 class="logo">Spoons</h1>
  <p>Joining <strong>{gameId}</strong></p>
  <label for="player-name">Your name</label>
  <!-- svelte-ignore a11y_autofocus -->
  <input id="player-name" class="text-input" bind:value={name} maxlength="20" autocomplete="given-name" autofocus />
  <button class="big-button" type="submit" disabled={!name.trim()}>That's me!</button>
</form>

<style>
  form {
    display: grid;
    gap: 12px;
    width: 100%;
    max-width: 420px;
    margin: auto;
    padding: 16px;
  }

  h1 {
    font-size: 4rem;
    text-align: center;
  }

  p {
    margin: 0;
    text-align: center;
  }

  label {
    font-weight: 800;
  }

  button:disabled {
    opacity: 0.5;
  }
</style>
