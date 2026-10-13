import adapter from "@sveltejs/adapter-vercel";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { loadEnv } from "vite";

import { build_content_security_policy_directives } from "./src/lib/infrastructure/security/contentSecurityPolicy.js";

const content_security_policy_environment = loadEnv(
  process.env.NODE_ENV === "production" ? "production" : "development",
  process.cwd(),
  "PUBLIC_",
);

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://svelte.dev/docs/kit/integrations
  // for more information about preprocessors
  preprocess: vitePreprocess(),

  kit: {
    adapter: adapter(),

    csp: {
      mode: "auto",
      directives: build_content_security_policy_directives(
        content_security_policy_environment,
      ),
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
