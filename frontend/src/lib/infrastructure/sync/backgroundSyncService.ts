import {
  get_database,
  type SportsOrgDatabase,
} from "$lib/adapters/repositories/database";
import { sync_store } from "$lib/presentation/stores/syncStore";
import { get_pulling_from_remote, set_pulling_from_remote } from "./syncState";
import { is_signed_in } from "$lib/adapters/iam/clerkAuthService";
import { get } from "svelte/store";

export { set_pulling_from_remote };

const DEBOUNCE_DELAY_MS = 3000;
const OFFLINE_RETRY_INTERVAL_MS = 60000;

const SYNCED_TABLE_NAMES = [
  "organizations",
  "competitions",
  "teams",
  "players",
  "officials",
  "fixtures",
  "sports",
  "team_staff",
  "team_staff_roles",
  "game_official_roles",
  "venues",
  "jersey_colors",
  "player_positions",
  "player_profiles",
  "team_profiles",
  "profile_links",
  "calendar_tokens",
  "competition_formats",
  "competition_teams",
  "player_team_memberships",
  "fixture_details_setups",
  "fixture_lineups",
  "activities",
  "activity_categories",
  "system_users",
  "identification_types",
  "identifications",
  "qualifications",
  "game_event_types",
  "genders",
  "live_game_logs",
  "game_event_logs",
  "player_team_transfer_histories",
  "official_associated_teams",
] as const;

interface BackgroundSyncState {
  is_running: boolean;
  has_pending_changes: boolean;
  is_online: boolean;
  debounce_timer_id: ReturnType<typeof setTimeout> | null;
  offline_retry_timer_id: ReturnType<typeof setInterval> | null;
  hooks_installed: boolean;
}

function create_initial_state(): BackgroundSyncState {
  return {
    is_running: false,
    has_pending_changes: false,
    is_online: typeof navigator !== "undefined" ? navigator.onLine : true,
    debounce_timer_id: null,
    offline_retry_timer_id: null,
    hooks_installed: false,
  };
}

let state: BackgroundSyncState = create_initial_state();

function handle_online_event(): void {
  state.is_online = true;
  console.log("[BackgroundSync] Device came online");

  if (state.has_pending_changes) {
    console.log("[BackgroundSync] Triggering sync for pending offline changes");
    trigger_debounced_sync();
  }

  stop_offline_retry_timer();
}

function handle_offline_event(): void {
  state.is_online = false;
  console.log("[BackgroundSync] Device went offline");
  cancel_pending_debounce();
  start_offline_retry_timer();
}

function cancel_pending_debounce(): void {
  if (state.debounce_timer_id === null) return;
  clearTimeout(state.debounce_timer_id);
  state.debounce_timer_id = null;
}

function trigger_debounced_sync(): void {
  cancel_pending_debounce();

  state.debounce_timer_id = setTimeout(() => {
    state.debounce_timer_id = null;
    execute_sync();
  }, DEBOUNCE_DELAY_MS);
}

async function execute_sync(): Promise<boolean> {
  if (!get(is_signed_in)) {
    console.log("[BackgroundSync] User not signed in — skipping sync");
    return false;
  }

  if (!state.is_online) {
    state.has_pending_changes = true;
    console.log("[BackgroundSync] Offline — marking changes as pending");
    return false;
  }

  try {
    console.log("[BackgroundSync] Starting sync...");
    const result = await sync_store.sync_now();
    state.has_pending_changes = !result.success;

    if (result.success) {
      console.log(
        `[BackgroundSync] Sync completed — pushed: ${result.records_pushed}, pulled: ${result.records_pulled}`,
      );
    } else {
      console.warn(
        "[BackgroundSync] Sync completed with errors:",
        result.errors,
      );
    }
    return result.success;
  } catch (error) {
    state.has_pending_changes = true;
    console.error("[BackgroundSync] Sync failed:", error);
    return false;
  }
}

function on_dexie_write(table_name: string): void {
  if (get_pulling_from_remote()) return;
  if (!get(is_signed_in)) return;
  console.log(`[BackgroundSync] Dexie write detected on table: ${table_name}`);
  state.has_pending_changes = true;
  trigger_debounced_sync();
}

function install_dexie_hooks(database: SportsOrgDatabase): boolean {
  for (const table_name of SYNCED_TABLE_NAMES) {
    const table = (database as unknown as Record<string, unknown>)[
      table_name
    ] as {
      hook: (event: string) => { subscribe: (fn: () => void) => void };
    };

    if (!table?.hook) continue;

    table.hook("creating").subscribe(() => {
      on_dexie_write(table_name);
    });

    table.hook("updating").subscribe(() => {
      on_dexie_write(table_name);
    });

    table.hook("deleting").subscribe(() => {
      on_dexie_write(table_name);
    });
  }

  console.log(
    `[BackgroundSync] Dexie hooks installed on ${SYNCED_TABLE_NAMES.length} tables`,
  );
  return true;
}

function start_offline_retry_timer(): void {
  if (state.offline_retry_timer_id !== null) return;

  state.offline_retry_timer_id = setInterval(() => {
    if (!state.has_pending_changes) return;

    if (state.is_online) {
      console.log(
        "[BackgroundSync] Back online during retry — syncing pending changes",
      );
      execute_sync();
      stop_offline_retry_timer();
      return;
    }

    console.log(
      "[BackgroundSync] Still offline with pending changes — will retry",
    );
  }, OFFLINE_RETRY_INTERVAL_MS);
}

function stop_offline_retry_timer(): void {
  if (state.offline_retry_timer_id === null) return;
  clearInterval(state.offline_retry_timer_id);
  state.offline_retry_timer_id = null;
}

function unsubscribe_from_events(): void {
  state.hooks_installed = false;
}

export function start_background_sync(): boolean {
  if (typeof window === "undefined") return false;
  if (state.is_running) return false;

  if (!state.hooks_installed) {
    const database = get_database();
    state.hooks_installed = install_dexie_hooks(database);
  }

  window.addEventListener("online", handle_online_event);
  window.addEventListener("offline", handle_offline_event);

  state.is_running = true;
  state.is_online = navigator.onLine;

  console.log("[BackgroundSync] Started — listening for Dexie database writes");

  if (state.is_online && get(is_signed_in)) {
    console.log("[BackgroundSync] Online and authenticated — triggering initial sync");
    trigger_debounced_sync();
  } else if (!get(is_signed_in)) {
    console.log("[BackgroundSync] Started without active session — sync deferred until sign-in");
  }

  return true;
}

export function stop_background_sync(): boolean {
  if (!state.is_running) return false;

  cancel_pending_debounce();
  stop_offline_retry_timer();
  unsubscribe_from_events();

  if (typeof window !== "undefined") {
    window.removeEventListener("online", handle_online_event);
    window.removeEventListener("offline", handle_offline_event);
  }

  state = create_initial_state();

  console.log("[BackgroundSync] Stopped");
  return true;
}

export function get_background_sync_status(): {
  is_running: boolean;
  has_pending_changes: boolean;
  is_online: boolean;
} {
  return {
    is_running: state.is_running,
    has_pending_changes: state.has_pending_changes,
    is_online: state.is_online,
  };
}

export function has_pending_unsynced_changes(): boolean {
  return state.has_pending_changes;
}

export async function flush_pending_changes(): Promise<{
  success: boolean;
  skipped_offline: boolean;
}> {
  if (!state.has_pending_changes) {
    return { success: true, skipped_offline: false };
  }

  if (!state.is_online) {
    console.log("[BackgroundSync] Cannot flush changes while offline");
    return { success: false, skipped_offline: true };
  }

  cancel_pending_debounce();
  const sync_result = await execute_sync();

  return { success: sync_result, skipped_offline: false };
}
