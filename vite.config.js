import { defineConfig } from 'vite';

// Relative base + hash routing: the built site runs from any static host,
// a sub-folder (e.g. GitHub Pages), or straight off the file system.
export default defineConfig({
  base: './',
  build: { outDir: 'dist', chunkSizeWarningLimit: 1500 },
});
