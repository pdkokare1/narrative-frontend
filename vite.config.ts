import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // FIXED: Changed to autoUpdate for aggressive updates
      includeAssets: ['favicon.ico', 'logo192.png', 'logo512.png'],
      // We removed the manual filename to let Vite handle version hashing naturally
      manifest: {
        short_name: "The Gamut",
        name: "The Gamut - Analyse The Full Spectrum",
        start_url: "/",
        display: "standalone",
        theme_color: "#0a0a0a",
        background_color: "#0a0a0a",
        icons: [
          {
            src: "logo192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "logo512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      }
    })
  ],
  server: {
    port: 3000, 
  },
  build: {
    outDir: 'build', 
    rollupOptions: {
      output: {
        // FIXED: Explicitly hashing filenames to bust browser cache
        entryFileNames: `assets/[name].[hash].js`,
        chunkFileNames: `assets/[name].[hash].js`,
        assetFileNames: `assets/[name].[hash].[ext]`,
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-firebase': ['firebase/app', 'firebase/auth'],
          'vendor-ui': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          'vendor-charts': ['chart.js', 'react-chartjs-2'],
          'vendor-utils': ['date-fns', 'axios', '@tanstack/react-query']
        }
      }
    }
  }
});
