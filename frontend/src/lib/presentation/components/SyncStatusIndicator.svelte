<script lang="ts">
  import { onDestroy } from "svelte";

  import SyncStatusIndicatorDetails from "$lib/presentation/components/SyncStatusIndicatorDetails.svelte";
  import { format_sync_status_text } from "$lib/presentation/logic/syncStatusIndicatorText";
  import { sync_store } from "$lib/presentation/stores/syncStore";
  import {
    is_syncing,
    last_sync_time,
    sync_error,
    sync_percentage,
    sync_progress,
  } from "$lib/presentation/stores/syncStoreDerived";
  import type { SyncErrorState } from "$lib/presentation/stores/syncStoreTypes";

  let show_details = false;
  let relative_time_tick = 0;

  const SYNC_PROGRESS_ICON_COLOR = "rgb(59 130 246 / 1)";
  const SYNC_ERROR_ICON_COLOR = "rgb(239 68 68 / 1)";
  const SYNC_SUCCESS_ICON_COLOR = "rgb(16 185 129 / 1)";

  const tick_interval = setInterval(() => {
    relative_time_tick++;
  }, 15000);

  $: current_table =
    $sync_progress.status === "active" ? $sync_progress.progress.table_name : "";

  $: sync_status_text = format_sync_status_text({
    sync_in_progress: $is_syncing,
    last_sync: $last_sync_time,
    current_percentage: $sync_percentage,
    relative_time_tick,
  });

  onDestroy(() => {
    clearInterval(tick_interval);
  });

  async function trigger_manual_sync(): Promise<void> {
    await sync_store.sync_now();
  }

  function get_sync_icon_class(sync_in_progress: boolean): string {
    return sync_in_progress ? "animate-spin" : "";
  }

  function get_sync_icon_color(
    sync_in_progress: boolean,
    error_state: SyncErrorState,
  ): string {
    if (sync_in_progress) return SYNC_PROGRESS_ICON_COLOR;
    if (error_state.status === "present") return SYNC_ERROR_ICON_COLOR;
    return SYNC_SUCCESS_ICON_COLOR;
  }
</script>

<div class="relative sync-status-indicator">
  <button
    type="button"
    on:click={() => (show_details = !show_details)}
    class="flex items-center gap-2 px-3 py-1.5 rounded-[0.175rem] bg-white/15 hover:bg-white/25 transition-colors text-sm"
    title="Sync Status"
  >
    <svg
      class="w-4 h-4 sync-status-indicator-icon {get_sync_icon_class($is_syncing)}"
      style="--sync-status-color: {get_sync_icon_color($is_syncing, $sync_error)};"
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
      {sync_status_text}
    </span>
  </button>

  {#if show_details}
    <SyncStatusIndicatorDetails
      sync_in_progress={$is_syncing}
      current_percentage={$sync_percentage}
      {current_table}
      last_sync={$last_sync_time}
      {relative_time_tick}
      sync_error_state={$sync_error}
      {trigger_manual_sync}
      on_close={() => (show_details = false)}
    />
  {/if}
</div>

<style>
  .sync-status-indicator-icon {
    color: var(--sync-status-color);
    stroke: currentColor;
  }

  :global(.header-panel .sync-status-indicator .sync-status-indicator-icon) {
    color: var(--sync-status-color) !important;
    stroke: currentColor !important;
  }
</style>
