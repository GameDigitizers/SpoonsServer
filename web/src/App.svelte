<script>
  import Landing from './Landing.svelte';
  import Phone from './phone/Phone.svelte';
  import Tv from './tv/Tv.svelte';

  // /             -> pick a game
  // /tv/<game>    -> the shared table screen
  // /<game>       -> a player's phone
  const [first, second] = location.pathname.split('/').filter(Boolean).map(decodeURIComponent);
</script>

{#if first === 'tv' && second}
  <Tv gameId={second} />
{:else if first}
  <Phone gameId={first} />
{:else}
  <Landing />
{/if}
