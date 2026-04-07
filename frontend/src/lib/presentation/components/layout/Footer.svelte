<script lang="ts">
  import { branding_store } from "$lib/presentation/stores/branding";

  import FooterBottomBar from "./FooterBottomBar.svelte";
  import FooterBrandPanel from "./FooterBrandPanel.svelte";
  import FooterLinkPanel from "./FooterLinkPanel.svelte";
  import type { FooterLink } from "./footerLinks";

  const current_year = new Date().getFullYear();
  const quick_links: FooterLink[] = [
    { href: "/organizations", label: "Organizations" },
    { href: "/competitions", label: "Competitions" },
    { href: "/teams", label: "Teams" },
    { href: "/fixtures", label: "Fixtures" },
  ];
  const support_links: FooterLink[] = [
    { href: "/help", label: "Help Center" },
    { href: "/contact", label: "Contact Us" },
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
  ];

  $: has_custom_logo =
    !!$branding_store.organization_logo_url &&
    $branding_store.organization_logo_url.length > 0;
</script>

<footer
  class="border-t border-theme-primary-600 dark:border-theme-primary-700 mt-auto relative overflow-hidden"
>
  {#if $branding_store.footer_pattern === "pattern" && $branding_store.background_pattern_url}
    <div
      class="absolute inset-0"
      style="background-image: url('{$branding_store.background_pattern_url}'); background-size: 200px; background-repeat: repeat;"
    ></div>
    <div class="absolute inset-0 bg-gray-900/30 dark:bg-gray-900/45"></div>
  {:else}
    <div
      class="absolute inset-0 bg-theme-primary-500 dark:bg-theme-primary-600"
    ></div>
  {/if}

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <FooterBrandPanel
        {has_custom_logo}
        organization_logo_url={$branding_store.organization_logo_url}
        organization_name={$branding_store.organization_name}
        organization_tagline={$branding_store.organization_tagline}
        social_media_links={$branding_store.social_media_links || []}
        show_panel_borders={$branding_store.show_panel_borders}
      />
      <FooterLinkPanel
        title="Quick Links"
        links={quick_links}
        show_panel_borders={$branding_store.show_panel_borders}
      />
      <FooterLinkPanel
        title="Support"
        links={support_links}
        show_panel_borders={$branding_store.show_panel_borders}
      />
    </div>
    <FooterBottomBar
      {current_year}
      organization_name={$branding_store.organization_name}
      show_panel_borders={$branding_store.show_panel_borders}
    />
  </div>
</footer>

<style>
  footer {
    margin-top: auto;
    flex-shrink: 0;
  }

  :global(footer a) {
    transition: all 0.2s ease-in-out;
  }

  :global(footer a:focus-visible) {
    outline: 2px solid theme("colors.primary.500");
    outline-offset: 2px;
    border-radius: 0.25rem;
  }

  :global(footer button svg) {
    transition: transform 0.2s ease-in-out;
  }

  :global(footer button:hover svg) {
    transform: scale(1.1);
  }

  :global(.footer-panel) {
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  }
  :global(.footer-panel) *:not(svg):not(path):not(.text-theme-secondary-600) {
    color: white !important;
  }
  :global(.footer-panel .text-theme-secondary-600) {
    color: var(--color-secondary-600) !important;
  }
  :global(.footer-panel a:hover) {
    color: #fcd34d !important;
  }
</style>
