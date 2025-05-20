import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      strategies: "injectManifest",
      srcDir: "src/workers",
      filename: "pwa.service-worker.js",
      devOptions: {
        enabled: true,
        type: "module",
      },
      includeAssets: ["**/*"],
      workbox: {
        globDirectory: "dist",
        globPatterns: ["**/*"],
        maximumFileSizeToCacheInBytes: 20 * 1024 * 1024, // 20 MB limit
      },
      injectManifest: {
        maximumFileSizeToCacheInBytes: 20 * 1024 * 1024, // 20 MB limit
        globDirectory: "dist",
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,jpeg}"],
      },
      manifest: {
        name: "Pwa Alarm",
        short_name: "Pwa Alarm",
        description: "Pwa Alarm for testing",
        theme_color: "#000000",
        background_color: "#000000",
        display: "standalone",
        scope: "/",
        start_url: "/",
        orientation: "portrait",
        icons: [
          {
            src: "/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
});
