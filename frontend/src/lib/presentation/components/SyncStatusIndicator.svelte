<script lang="ts">
  import { onDestroy } from "svelte";

  import SyncStatusIndicatorDetails from "$lib/presentation/components/SyncStatusIndicatorDetails.svelte";
  import { sync_store } from "$lib/presentation/stores/syncStore";
  import {
    is_syncing,
    last_sync_time,
    sync_error,
    sync_percentage,
    sync_progress,
  } from "$lib/presentation/stores/syncStoreDerived";

  let show_details = false;
  let sync_in_progress = false;
  let current_percentage = 0;
  let current_table = "";
  let relative_time_tick = 0;

  is_syncing.subscribe((value) => {
    sync_in_progress = value;
  });

  sync_percentage.subscribe((value) => {
    current_percentage = value;
  });

  sync_progress.subscribe((value) => {
    current_table = value?.table_name ?? "";
  });

  let last_sync: string | null = null;
  last_sync_time.subscribe((value) => {
    last_sync = value;
  });

  let error_message: string | null = null;
  sync_error.subscribe((value) => {
    error_message = value;
  });

  const tick_interval = setInterval(() => {
    relative_time_tick++;
  }, 15000);

  onDestroy(() => {
    clearInterval(tick_interval);
  });

  async function trigger_manual_sync(): Promise<void> {
    await sync_store.sync_now();
  }

  function get_sync_icon_class(): string {
    if (sync_in_progress) return "animate-spin text-blue-500";
    if (error_message) return "text-red-500";
    return "text-emerald-500";
  }

  function format_sync_status_text(): string {
    if (!sync_in_progress) {
      if (!last_sync) return "Never";
      const date = new Date(last_sync);
      const now = new Date();
      const diff_ms = now.getTime() - date.getTime();
      const diff_seconds = Math.floor(diff_ms / 1000);
      const diff_minutes = Math.floor(diff_seconds / 60);
      const diff_hours = Math.floor(diff_minutes / 60);
      if (diff_seconds < 15) return "Just now";
      if (diff_seconds < 60) return `${diff_seconds}s ago`;
      if (diff_minutes < 60) return `${diff_minutes}m ago`;
      if (diff_hours < 24) return `${diff_hours}h ago`;
      return date.toLocaleDateString();
    }
    return `${current_percentage}%`;
  }
</script>

<div class="relative">
  <button
    type="button"
    on:click={() => (show_details = !show_details)}
    class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition-colors text-sm"
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
    <span class="hidden sm:inline text-white/80">
      {format_sync_status_text()}
    </span>
  </button>

  {#if show_details}
    <SyncStatusIndicatorDetails
      {sync_in_progress}
      {current_percentage}
      {current_table}
      {last_sync}
      {relative_time_tick}
      {error_message}
      {trigger_manual_sync}
      on_close={() => (show_details = false)}
    />
  {/if}
</div>
