import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

const SERVER = 'http://localhost:3339';

export default defineConfig({
  root: 'web',
  plugins: [svelte()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    host: true, // so phones on the same Wi-Fi can reach the dev server
    port: 3340,
    proxy: {
      '/socket.io': { target: SERVER, ws: true },
      '/api': SERVER,
    },
  },
});
