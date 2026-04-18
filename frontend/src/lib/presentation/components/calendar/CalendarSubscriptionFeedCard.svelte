<script lang="ts">
  import {
    type CalendarToken,
    get_feed_type_display_name,
  } from "$lib/core/entities/CalendarToken";

  export let feed: CalendarToken;
  export let copy_success_token: string | undefined = undefined;
  export let get_https_url: (token: string) => string = () => "";
  export let format_date: (iso_string: CalendarToken["last_accessed_at"]) => string =
    () => "Never";
  export let on_revoke: (token: string) => void = () => {};
  export let on_open_webcal: (token: string) => void = () => {};
  export let on_copy: (text: string, token: string) => void = () => {};
</script>

<div
  class="feed-card p-4 bg-white dark:bg-accent-800 rounded-lg border border-accent-200 dark:border-accent-700"
>
  <div class="flex items-start justify-between">
    <div class="feed-info">
      <h4 class="font-medium text-accent-900 dark:text-accent-100">
        {feed.entity_name || get_feed_type_display_name(feed.feed_type)}
      </h4>
      <p class="text-sm text-accent-500 dark:text-accent-400 mt-1">
        {get_feed_type_display_name(
          feed.feed_type,
        )}{#if feed.reminder_minutes_before}
          • Reminder {feed.reminder_minutes_before} min before{/if}
      </p>
      <p class="text-xs text-accent-400 dark:text-accent-500 mt-1">
        Last accessed: {format_date(feed.last_accessed_at)} • {feed.access_count}
        syncs
      </p>
    </div>
    <button
      type="button"
      class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
      on:click={() => on_revoke(feed.token)}>Revoke</button
    >
  </div>

  <div class="feed-actions mt-4 space-y-2">
    <button
      type="button"
      class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-[0.175rem] transition-colors"
      on:click={() => on_open_webcal(feed.token)}
    >
      <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
        ><path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2z"
        /></svg
      >
      Subscribe in Calendar App
    </button>

    <div class="url-copy-section">
      <span class="text-xs text-accent-500 dark:text-accent-400 block mb-1"
        >Or copy the feed URL:</span
      >
      <div class="flex gap-2">
        <input
          type="text"
          readonly
          value={get_https_url(feed.token)}
          class="flex-1 text-xs px-3 py-2 bg-accent-100 dark:bg-accent-700 border border-accent-200 dark:border-accent-600 rounded-[0.175rem] text-accent-600 dark:text-accent-300"
        />
        <button
          type="button"
          class="px-3 py-2 bg-accent-200 hover:bg-accent-300 dark:bg-accent-600 dark:hover:bg-accent-500 rounded-[0.175rem] transition-colors"
          on:click={() => on_copy(get_https_url(feed.token), feed.token)}
        >
          {#if copy_success_token === feed.token}
            <svg
              class="h-4 w-4 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              /></svg
            >
          {:else}
            <svg
              class="h-4 w-4 text-accent-600 dark:text-accent-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              /></svg
            >
          {/if}
        </button>
      </div>
    </div>
  </div>
</div>
