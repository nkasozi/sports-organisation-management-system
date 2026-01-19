import adapter from "@sveltejs/adapter-vercel";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://svelte.dev/docs/kit/integrations
  // for more information about preprocessors
  preprocess: vitePreprocess(),

  kit: {
    // Vercel adapter for deployment
    adapter: adapter({
      // Optional: configure the adapter
      runtime: "nodejs18.x",
    }),

    // API proxy for development
    alias: {
      $lib: "src/lib",
    },
  },
};

export default config;
