<script lang="ts">
  import type { FooterLink } from "./footerLinks";

  export let title: string;
  export let links: FooterLink[] = [];
  export let show_panel_borders: boolean = false;
</script>

<div
  class="bg-black/25 dark:bg-black/40 backdrop-blur-sm rounded-lg p-4 footer-panel {show_panel_borders
    ? 'border-2 border-white/60'
    : ''}"
>
  <h3
    class="text-sm font-semibold text-white tracking-wider uppercase mb-4 drop-shadow-md"
  >
    {title}
  </h3>
  <ul class="space-y-3">
    {#each links as link}
      <li>
        <a
          href={link.href}
          class="text-sm text-gray-800 hover:text-secondary-600 transition-colors duration-200"
          >{link.label}</a
        >
      </li>
    {/each}
  </ul>
</div>
