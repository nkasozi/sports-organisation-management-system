import * as universal from '../entries/pages/organizations/_page.ts.js';

export const index = 4;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/organizations/_page.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/organizations/+page.ts";
export const imports = ["_app/immutable/nodes/4.D4G_-AZk.js","_app/immutable/chunks/CWj6FrbW.js","_app/immutable/chunks/69_IOA4Y.js","_app/immutable/chunks/DIeogL5L.js"];
export const stylesheets = [];
export const fonts = [];
