<script>
  const WORDS = ['soup', 'ladle', 'teaspoon', 'spork', 'gravy', 'pudding', 'stew', 'chowder'];
  const suggestion = `${WORDS[Math.floor(Math.random() * WORDS.length)]}-${Math.floor(Math.random() * 90) + 10}`;

  let gameName = $state(suggestion);
  const slug = $derived(gameName.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, ''));

  function go(path) {
    if (slug) {
      location.href = path + encodeURIComponent(slug);
    }
  }
</script>

<main>
  <h1 class="logo">Spoons</h1>

  <form onsubmit={(event) => { event.preventDefault(); go('/'); }}>
    <label for="game-name">Game name</label>
    <input id="game-name" class="text-input" bind:value={gameName} autocomplete="off" autocapitalize="off" />

    <button class="big-button" type="submit" disabled={!slug}>Join on this phone</button>
    <button class="big-button secondary" type="button" disabled={!slug} onclick={() => go('/tv/')}>
      Show the table on this screen
    </button>
  </form>

  <section>
    <h2>How it works</h2>
    <ol>
      <li>Open the table on a TV or laptop everyone can see (cast the tab if you like).</li>
      <li>Everyone joins the same game name on their phone.</li>
      <li>Draw, keep or pass, and try to collect four of a kind.</li>
      <li>Got four? Grab a spoon. See a spoon go missing? Grab one too, fast!</li>
    </ol>
  </section>
</main>

<style>
  main {
    max-width: 420px;
    margin: 0 auto;
    padding: 24px 16px 40px;
  }

  h1 {
    font-size: clamp(4rem, 22vw, 6rem);
    text-align: center;
  }

  form {
    display: grid;
    gap: 14px;
    margin-top: 12px;
  }

  label {
    font-weight: 800;
  }

  button:disabled {
    opacity: 0.5;
  }

  section {
    margin-top: 32px;
    padding: 16px 18px;
    border-radius: 14px;
    background: rgb(255 255 255 / 0.45);
  }

  h2 {
    margin: 0 0 8px;
    font-size: 1.1rem;
  }

  ol {
    margin: 0;
    padding-left: 1.2em;
    line-height: 1.5;
  }
</style>
