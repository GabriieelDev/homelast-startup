import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";
import { preloadLogo } from "./vite-plugin-preload-logo";

const DAY = 60 * 60 * 24;

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    preloadLogo(),
    // Service worker is intentionally NOT enabled in dev (no `devOptions`).
    VitePWA({
      // The user decides when to update (toast in PwaUpdatePrompt); never auto-reload.
      registerType: "prompt",
      manifest: {
        name: "HomeLast Startup",
        short_name: "HomeLast",
        lang: "pt-BR",
        start_url: "/",
        scope: "/",
        display: "standalone",
        theme_color: "#1D2D50",
        background_color: "#FFFFFF",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "maskable-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // App shell only (hashed JS/CSS/HTML), so the app opens without network.
        globPatterns: ["**/*.{js,css,html,webp,png,svg}"],
        navigateFallback: "/index.html",
        cleanupOutdatedCaches: true,
        // Only these runtime rules exist. Anything not matched here (Supabase
        // /rest/v1, /auth/v1, /realtime/v1, /functions/v1, avatars) goes straight
        // to the network and is never stored by the service worker.
        runtimeCaching: [
          {
            // Google Fonts CSS: small and can change, so serve cached and refresh in background.
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "google-fonts-styles",
              expiration: { maxEntries: 10, maxAgeSeconds: 30 * DAY },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Font files are immutable (versioned URLs), so cache-first for a year.
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-files",
              expiration: { maxEntries: 30, maxAgeSeconds: 365 * DAY },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Public product/banner images only. Upload paths are unique
            // (timestamp + random, upsert:false), so a URL never changes content.
            // The `avatares` bucket does not match and is never cached.
            urlPattern:
              /^https:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/public\/(?:produtos|banners)\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "supabase-public-images",
              expiration: { maxEntries: 150, maxAgeSeconds: 14 * DAY, purgeOnQuotaError: true },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
