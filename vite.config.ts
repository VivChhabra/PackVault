import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// NOTE:
// We proxy requests to https://api.pokemontcg.io through Vite during local dev.
// This avoids browser/network CORS issues and keeps the UI unchanged.
export default defineConfig({
  plugins: [react()],
  server: {
    // If 5173 is taken, Vite will automatically pick the next available port.
    proxy: {
      "/api": {
        target: "https://api.pokemontcg.io",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ""),
      },
    },
  },
});
