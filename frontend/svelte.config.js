import adapter from "@sveltejs/adapter-vercel";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { loadEnv } from "vite";

import {
  build_content_security_policy_directives,
  CSP_DEPLOYMENT_MODE,
} from "./src/lib/infrastructure/security/contentSecurityPolicy.js";

const content_security_policy_deployment_mode =
  process.env.NODE_ENV === "production"
    ? CSP_DEPLOYMENT_MODE.PRODUCTION
    : CSP_DEPLOYMENT_MODE.DEVELOPMENT;

const content_security_policy_environment = loadEnv(
  content_security_policy_deployment_mode,
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
        content_security_policy_deployment_mode,
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
