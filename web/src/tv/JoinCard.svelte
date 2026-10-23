<script>
  import QRCode from 'qrcode';

  let { gameId, compact = false } = $props();

  let origin = $state(location.origin);
  const joinUrl = $derived(`${origin}/${encodeURIComponent(gameId)}`);
  let qr = $state('');

  // "localhost" is useless to a phone, so swap in this machine's Wi-Fi address
  $effect(() => {
    if (!['localhost', '127.0.0.1'].includes(location.hostname)) {
      return;
    }
    fetch('/api/addresses')
      .then((res) => res.json())
      .then(({ addresses }) => {
        if (addresses.length) {
          const port = location.port ? `:${location.port}` : '';
          origin = `${location.protocol}//${addresses[0]}${port}`;
        }
      })
      .catch(() => {});
  });

  $effect(() => {
    QRCode.toString(joinUrl, { type: 'svg', margin: 1, color: { dark: '#2b1a0e', light: '#fff8e6' } })
      .then((svg) => (qr = svg));
  });
</script>

<div class="join" class:compact>
  {#if !compact}
    <h1 class="logo">Spoons</h1>
  {/if}
  <div class="qr">{@html qr}</div>
  <p>Scan or visit</p>
  <p class="url">{joinUrl.replace(/^https?:\/\//, '')}</p>
</div>

<style>
  .join {
    padding: 2vh 2.5vw;
    border: 4px dashed white;
    border-radius: 20px;
    background: var(--orange);
    color: white;
    text-align: center;
    box-shadow: 0 0 0 14px var(--orange), 0 10px 40px rgb(0 0 0 / 0.4);
  }

  .logo {
    font-size: 8vh;
    color: var(--butter);
  }

  .qr {
    width: 26vh;
    margin: 1vh auto;
  }

  .compact .qr {
    width: 18vh;
  }

  .qr :global(svg) {
    display: block;
    width: 100%;
    height: auto;
    border-radius: 8px;
  }

  p {
    margin: 0;
    font-size: 2.4vh;
  }

  .url {
    font-weight: 800;
    font-size: 3.2vh;
  }
</style>
