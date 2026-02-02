<script lang="ts">
  import {
    sync_store,
    is_syncing,
    last_sync_time,
    sync_error,
  } from "$lib/presentation/stores/syncStore";

  let show_details = false;
  let sync_in_progress = false;

  is_syncing.subscribe((value) => {
    sync_in_progress = value;
  });

  let last_sync: string | null = null;
  last_sync_time.subscribe((value) => {
    last_sync = value;
  });

  let error_message: string | null = null;
  sync_error.subscribe((value) => {
    error_message = value;
  });

  async function trigger_manual_sync(): Promise<void> {
    await sync_store.sync_now();
  }

  function format_relative_time(timestamp: string | null): string {
    if (!timestamp) return "Never";

    const date = new Date(timestamp);
    const now = new Date();
    const diff_ms = now.getTime() - date.getTime();
    const diff_seconds = Math.floor(diff_ms / 1000);
    const diff_minutes = Math.floor(diff_seconds / 60);
    const diff_hours = Math.floor(diff_minutes / 60);

    if (diff_seconds < 60) return "Just now";
    if (diff_minutes < 60) return `${diff_minutes}m ago`;
    if (diff_hours < 24) return `${diff_hours}h ago`;
    return date.toLocaleDateString();
  }

  function get_sync_icon_class(): string {
    if (sync_in_progress) return "animate-spin text-blue-500";
    if (error_message) return "text-red-500";
    return "text-emerald-500";
  }
</script>

<div class="relative">
  <button
    type="button"
    on:click={() => (show_details = !show_details)}
    class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent-100 dark:bg-accent-800 hover:bg-accent-200 dark:hover:bg-accent-700 transition-colors text-sm"
    title="Sync Status"
  >
    <svg
      class="w-4 h-4 {get_sync_icon_class()}"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
    <span class="hidden sm:inline text-accent-700 dark:text-accent-300">
      {sync_in_progress ? "Syncing..." : format_relative_time(last_sync)}
    </span>
  </button>

  {#if show_details}
    <div
      class="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-accent-800 rounded-xl shadow-lg border border-accent-200 dark:border-accent-700 p-4 z-50"
    >
      <div class="flex items-center justify-between mb-3">
        <h4 class="text-sm font-semibold text-accent-900 dark:text-white">
          Cloud Sync
        </h4>
        <button
          type="button"
          on:click={() => (show_details = false)}
          class="text-accent-400 hover:text-accent-600 dark:hover:text-accent-200"
          aria-label="Close sync details"
        >
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div class="space-y-3">
        <div class="flex items-center justify-between text-sm">
          <span class="text-accent-600 dark:text-accent-400">Status</span>
          <span
            class="px-2 py-0.5 rounded-full text-xs font-medium {sync_in_progress
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
              : error_message
                ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'}"
          >
            {sync_in_progress ? "Syncing" : error_message ? "Error" : "Synced"}
          </span>
        </div>

        <div class="flex items-center justify-between text-sm">
          <span class="text-accent-600 dark:text-accent-400">Last Sync</span>
          <span class="text-accent-900 dark:text-white">
            {format_relative_time(last_sync)}
          </span>
        </div>

        {#if error_message}
          <div class="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p class="text-xs text-red-700 dark:text-red-300">
              {error_message}
            </p>
          </div>
        {/if}

        <button
          type="button"
          on:click={trigger_manual_sync}
          disabled={sync_in_progress}
          class="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-accent-400 dark:disabled:bg-accent-600 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          {#if sync_in_progress}
            <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Syncing...
          {:else}
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Sync Now
          {/if}
        </button>

        <p class="text-xs text-accent-500 dark:text-accent-400 text-center">
          Data syncs to Convex cloud when configured
        </p>
      </div>
    </div>
  {/if}
</div>
