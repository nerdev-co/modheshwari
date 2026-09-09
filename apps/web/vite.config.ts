import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@repo/ui": path.resolve(__dirname, "../../packages/ui/src"),
      "@modheshwari/db": path.resolve(__dirname, "../../packages/db"),
      "@modheshwari/utils": path.resolve(__dirname, "../../packages/utils"),
      "@modheshwari/config": path.resolve(__dirname, "../../packages/config"),
      "@modheshwari/redis": path.resolve(__dirname, "../../packages/redis"),
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: process.env.API_BACKEND_URL || "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
