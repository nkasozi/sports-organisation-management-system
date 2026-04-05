import adapter from "@sveltejs/adapter-vercel";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://svelte.dev/docs/kit/integrations
  // for more information about preprocessors
  preprocess: vitePreprocess(),

  kit: {
    adapter: adapter(),

    csp: {
      mode: "auto",
      directives: {
        "default-src": ["self"],
        "script-src": [
          "self",
          "https://clerk.com",
          "https://*.clerk.accounts.dev",
          "https://va.vercel-scripts.com",
        ],
        "style-src": ["self", "unsafe-inline"],
        "font-src": ["self"],
        "img-src": [
          "self",
          "data:",
          "blob:",
          "https://*.clerk.com",
          "https://img.clerk.com",
        ],
        "connect-src": [
          "self",
          "https://*.convex.cloud",
          "wss://*.convex.cloud",
          "https://*.clerk.com",
          "https://clerk.com",
          "https://*.clerk.accounts.dev",
          "https://clerk-telemetry.com",
          "https://va.vercel-scripts.com",
        ],
        "frame-src": [
          "self",
          "https://*.clerk.com",
          "https://*.clerk.accounts.dev",
        ],
        "worker-src": ["self", "blob:"],
        "object-src": ["none"],
        "base-uri": ["self"],
        "form-action": ["self"],
        "frame-ancestors": ["none"],
      },
    },

    // API proxy for development
    alias: {
      $lib: "src/lib",
      $convex: "convex",
    },

    prerender: {
      handleUnseenRoutes: "warn",
    },
  },
};

export default config;
