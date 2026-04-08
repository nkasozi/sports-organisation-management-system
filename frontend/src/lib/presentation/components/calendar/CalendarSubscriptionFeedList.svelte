<script lang="ts">
  import type { CalendarToken } from "$lib/core/entities/CalendarToken";

  import CalendarSubscriptionFeedCard from "./CalendarSubscriptionFeedCard.svelte";

  export let copy_success_token: string | null = null;
  export let existing_feeds: CalendarToken[] = [];
  export let format_date: (iso_string: string | null) => string = () => "";
  export let get_https_url: (token: string) => string = () => "";
  export let is_loading: boolean = false;
  export let on_copy: (
    text: string,
    token: string,
  ) => Promise<boolean> = async () => false;
  export let on_open_webcal: (token: string) => void = () => {};
  export let on_revoke: (token: string) => Promise<boolean> = async () => false;
</script>

{#if is_loading}
  <div class="loading-state py-8 text-center">
    <svg
      class="animate-spin h-8 w-8 mx-auto text-primary-500"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      ><circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      /><path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      /></svg
    >
    <p class="mt-2 text-accent-600 dark:text-accent-400">Loading feeds...</p>
  </div>
{:else if existing_feeds.length === 0}
  <div
    class="empty-state py-8 text-center bg-accent-50 dark:bg-accent-800 rounded-lg mt-6"
  >
    <svg
      class="h-12 w-12 mx-auto text-accent-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      ><path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      /></svg
    >
    <p class="mt-2 text-accent-600 dark:text-accent-400">
      No calendar subscriptions yet
    </p>
    <p class="text-sm text-accent-500 dark:text-accent-500 mt-1">
      Create a subscription to sync events with your calendar app
    </p>
  </div>
{:else}
  <div class="feeds-list space-y-4 mt-6">
    {#each existing_feeds as feed}
      <CalendarSubscriptionFeedCard
        {feed}
        {copy_success_token}
        {get_https_url}
        {format_date}
        {on_revoke}
        {on_open_webcal}
        {on_copy}
      />
    {/each}
  </div>
{/if}
