import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  server: {
    proxy: {
      // Proxy API requests to the backend during development
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
