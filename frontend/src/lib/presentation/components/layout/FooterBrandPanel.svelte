<script lang="ts">
  import { split_organization_name } from "$lib/presentation/logic/dashboardPageDisplayLogic";
  import type { SocialMediaLink } from "$lib/presentation/stores/branding";

  import {
    FOOTER_FALLBACK_SOCIAL_PLATFORMS,
    get_social_media_icon,
    get_social_media_label,
  } from "./footerSocialMedia";

  export let has_custom_logo: boolean = false;
  export let organization_logo_url: string = "";
  export let organization_name: string = "";
  export let organization_tagline: string = "";
  export let social_media_links: SocialMediaLink[] = [];
  export let show_panel_borders: boolean = false;
</script>

<div
  class="col-span-1 md:col-span-2 bg-black/25 dark:bg-black/40 backdrop-blur-sm rounded-lg p-4 footer-panel {show_panel_borders
    ? 'border-2 border-white/60'
    : ''}"
>
  <div class="flex items-center space-x-3 mb-4">
    <div
      class="h-8 w-8 rounded-lg flex items-center justify-center overflow-hidden {has_custom_logo
        ? ''
        : 'bg-theme-secondary-600'}"
    >
      {#if has_custom_logo}
        <img
          src={organization_logo_url}
          alt="Organization Logo"
          class="h-full w-full object-cover"
        />
      {:else}
        <svg class="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
            clip-rule="evenodd"
          />
        </svg>
      {/if}
    </div>
    <span class="text-xl font-bold text-black">
      {#if split_organization_name(organization_name).prefix}
        {split_organization_name(organization_name).prefix}
        <span class="text-theme-secondary-600"
          >{split_organization_name(organization_name).suffix}</span
        >
        {#if split_organization_name(organization_name).remainder}
          {split_organization_name(organization_name).remainder}
        {/if}
      {:else}
        <span class="text-theme-secondary-600"
          >{split_organization_name(organization_name).suffix}</span
        >
      {/if}
    </span>
  </div>

  <p class="text-sm text-gray-800 mb-4 max-w-md">
    {organization_tagline ||
      "Track competitions, teams, players, officials and fixtures for your sport all in one place."}
  </p>

  <div class="flex space-x-4">
    {#if social_media_links.length > 0}
      {#each social_media_links as link (link.platform)}
        {#if link.url}
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            class="text-gray-800 hover:text-theme-secondary-600 transition-colors duration-200"
            aria-label={get_social_media_label(link.platform)}
            title={get_social_media_label(link.platform)}
          >
            <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"
              ><path d={get_social_media_icon(link.platform)} /></svg
            >
          </a>
        {/if}
      {/each}
    {:else}
      {#each FOOTER_FALLBACK_SOCIAL_PLATFORMS as platform}
        <button
          type="button"
          class="text-gray-800 hover:text-theme-secondary-600 transition-colors duration-200"
          aria-label={get_social_media_label(platform)}
        >
          <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"
            ><path d={get_social_media_icon(platform)} /></svg
          >
        </button>
      {/each}
    {/if}
  </div>
</div>
