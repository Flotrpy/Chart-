import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  worker: {
    format: 'es',
  },
  build: {
    target: 'es2022',
    // MapLibre alone is ~250 KB gzip; it is split out and budgeted separately.
    chunkSizeWarningLimit: 1100,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            // Changes rarely → long-lived cache, and keeps app code small.
            {
              name: 'maplibre',
              test: /node_modules[\\/](maplibre-gl|@maplibre)[\\/]/,
              priority: 20,
            },
            {
              name: 'react',
              test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              priority: 10,
            },
          ],
        },
      },
    },
  },
});
