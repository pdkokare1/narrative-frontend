import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // Changed from 'autoUpdate' to 'prompt' to prevent reload loops
      includeAssets: ['favicon.ico', 'logo192.png', 'logo512.png'],
      manifest: {
        short_name: "The Gamut",
        name: "The Gamut - Analyse The Full Spectrum",
        icons: [
          {
            src: "logo192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "logo512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ],
        start_url: ".",
        display: "standalone",
        theme_color: "#0a0a0a",
        background_color: "#0a0a0a"
      }
    })
  ],
  server: {
    port: 3000, // Keep port 3000 for consistency
  },
  build: {
    outDir: 'build', // React Scripts uses 'build', Vite uses 'dist' by default. We keep 'build' for Vercel/Capacitor compatibility.
  }
});
