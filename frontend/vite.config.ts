import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    environment: "node",
    exclude: ["**/node_modules/**", "**/.svelte-kit/**", "**/dist/**"],
    teardownTimeout: 1000,
    include: ["src/**/*.test.ts"],
    env: {
      VITE_AUTH_SECRET_KEY: "vitest-only-test-secret-key-not-for-production",
      AUTH_SECRET_KEY: "vitest-only-test-secret-key-not-for-production",
    },
  },
  server: {
    fs: {
      allow: ["."],
    },
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
