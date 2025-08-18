import "clsx";
import { p as pop, b as push } from "../../chunks/index2.js";
import "@sveltejs/kit/internal";
import "../../chunks/exports.js";
import "../../chunks/utils2.js";
import "../../chunks/state.svelte.js";
function ThemeProvider($$payload, $$props) {
  push();
  {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`<div class="min-h-screen bg-gray-50 dark:bg-accent-900 flex items-center justify-center"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div></div>`);
  }
  $$payload.out.push(`<!--]-->`);
  pop();
}
function Layout($$payload, $$props) {
  push();
  ThemeProvider($$payload);
  pop();
}
function _layout($$payload, $$props) {
  Layout($$payload);
}
export {
  _layout as default
};
