import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";
import { preloadLogo } from "./vite-plugin-preload-logo";

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
      // Own service worker (src/sw.ts) so it can handle push notifications.
      // Precache and runtime caching rules live there.
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      injectManifest: {
        // App shell only (hashed JS/CSS/HTML), so the app opens without network.
        globPatterns: ["**/*.{js,css,html,webp,png,svg}"],
      },
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
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
