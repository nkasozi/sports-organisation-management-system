import {
  get_database,
  type SportsOrgDatabase,
} from "$lib/adapters/repositories/database";
import { get_pulling_from_remote, set_pulling_from_remote } from "./syncState";
import { delete_record_in_convex } from "./convexSyncService";
import { is_signed_in } from "$lib/adapters/iam/clerkAuthService";
import { get } from "svelte/store";
import type {
  SyncOrchestratorPort,
  SyncRestorationHandlers,
  RemoteChangeSubscriberPort,
  LocalChangePublisherPort,
  LocalSyncStatus,
} from "$lib/core/interfaces/ports";
import {
  create_success_result,
  create_failure_result,
} from "$lib/core/types/Result";
import type { AsyncResult, Result } from "$lib/core/types/Result";

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
  is_restoration_sync_in_progress: boolean;
}

function create_initial_state(): BackgroundSyncState {
  return {
    is_running: false,
    has_pending_changes: false,
    is_online: typeof navigator !== "undefined" ? navigator.onLine : true,
    debounce_timer_id: null,
    offline_retry_timer_id: null,
    hooks_installed: false,
    is_restoration_sync_in_progress: false,
  };
}

let state: BackgroundSyncState = create_initial_state();
let orchestrator: SyncOrchestratorPort | null = null;
let restoration_handlers: SyncRestorationHandlers | null = null;
let remote_subscriber: RemoteChangeSubscriberPort | null = null;

export function configure_orchestrator(
  sync_orchestrator: SyncOrchestratorPort,
): Result<boolean> {
  orchestrator = sync_orchestrator;
  console.log("[BackgroundSync] Orchestrator configured");
  return create_success_result(true);
}

export function configure_restoration_handlers(
  handlers: SyncRestorationHandlers,
): Result<boolean> {
  restoration_handlers = handlers;
  console.log("[BackgroundSync] Restoration handlers configured");
  return create_success_result(true);
}

export function configure_remote_subscriber(
  subscriber: RemoteChangeSubscriberPort,
): Result<boolean> {
  remote_subscriber = subscriber;
  console.log("[BackgroundSync] Remote subscriber configured");
  return create_success_result(true);
}

function handle_online_event(): void {
  state.is_online = true;
  console.log("[BackgroundSync] Device came online");
  stop_offline_retry_timer();
  run_network_restoration_sync();
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
    execute_push_sync();
  }, DEBOUNCE_DELAY_MS);
}

async function execute_push_sync(): Promise<boolean> {
  if (!get(is_signed_in)) {
    console.log("[BackgroundSync] User not signed in — skipping sync");
    return false;
  }

  if (!state.is_online) {
    state.has_pending_changes = true;
    console.log("[BackgroundSync] Offline — marking changes as pending");
    return false;
  }

  if (!orchestrator) {
    console.warn("[BackgroundSync] No orchestrator configured — skipping sync");
    return false;
  }

  const timestamp_cache = remote_subscriber?.get_cached_table_timestamps();
  console.log("[BackgroundSync] Executing push-only sync...");

  const result = await orchestrator.sync_now("push", {
    remote_timestamp_cache: timestamp_cache,
  });

  if (result.success) {
    state.has_pending_changes = false;
    console.log(
      `[BackgroundSync] Push sync completed — pushed: ${result.data.records_pushed}`,
    );
    return true;
  }

  state.has_pending_changes = true;
  console.warn("[BackgroundSync] Push sync failed:", result.error.message);
  return false;
}

async function run_network_restoration_sync(): Promise<void> {
  if (!get(is_signed_in)) {
    console.log("[BackgroundSync] Not signed in — skipping restoration sync");
    return;
  }

  if (!orchestrator) {
    console.warn(
      "[BackgroundSync] No orchestrator — skipping restoration sync",
    );
    if (state.has_pending_changes) {
      trigger_debounced_sync();
    }
    return;
  }

  if (state.is_restoration_sync_in_progress) {
    console.log("[BackgroundSync] Restoration sync already in progress");
    return;
  }

  state.is_restoration_sync_in_progress = true;
  console.log(
    "[BackgroundSync] Starting full bidirectional restoration sync...",
  );

  const websocket_was_running = remote_subscriber?.is_running() ?? false;

  if (websocket_was_running) {
    console.log(
      "[BackgroundSync] Pausing WebSocket subscriptions for restoration sync",
    );
    restoration_handlers?.stop_remote_sync();
  }

  try {
    const result = await orchestrator.sync_now("bidirectional", {
      use_fresh_timestamps: true,
    });

    if (result.success) {
      state.has_pending_changes = false;
      console.log(
        `[BackgroundSync] Restoration sync completed — pushed: ${result.data.records_pushed}, pulled: ${result.data.records_pulled}`,
      );
    } else {
      console.warn(
        "[BackgroundSync] Restoration sync failed:",
        result.error.message,
      );
    }
  } finally {
    if (websocket_was_running) {
      console.log("[BackgroundSync] Resuming WebSocket subscriptions");
      restoration_handlers?.start_remote_sync();
    }
    state.is_restoration_sync_in_progress = false;
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
      hook: (event: string) => {
        subscribe: (fn: (primKey: unknown) => void) => void;
      };
    };

    if (!table?.hook) continue;

    table.hook("creating").subscribe(() => {
      on_dexie_write(table_name);
    });

    table.hook("updating").subscribe(() => {
      on_dexie_write(table_name);
    });

    table.hook("deleting").subscribe((primKey: unknown) => {
      const local_id = typeof primKey === "string" ? primKey : String(primKey);
      console.log(
        `[BackgroundSync] Dexie delete detected on ${table_name}: local_id=${local_id}`,
      );
      delete_record_in_convex(table_name, local_id);
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
      run_network_restoration_sync();
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

  if (!get(is_signed_in)) {
    console.log(
      "[BackgroundSync] Started without active session — sync deferred until sign-in",
    );
  }

  return true;
}

export function stop_background_sync(): boolean {
  if (!state.is_running) return false;

  cancel_pending_debounce();
  stop_offline_retry_timer();

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

export async function flush_pending_changes(): AsyncResult<{
  skipped_offline: boolean;
}> {
  if (!state.has_pending_changes) {
    return create_success_result({ skipped_offline: false });
  }

  if (!state.is_online) {
    console.log("[BackgroundSync] Cannot flush changes while offline");
    return create_success_result({ skipped_offline: true });
  }

  cancel_pending_debounce();
  const sync_succeeded = await execute_push_sync();

  return sync_succeeded
    ? create_success_result({ skipped_offline: false })
    : create_failure_result("Flush failed — check logs for push sync errors");
}

export function create_local_change_publisher(): LocalChangePublisherPort {
  return {
    start: () => {
      const started = start_background_sync();
      return started
        ? create_success_result(true)
        : create_failure_result(
            "Background sync already running or not in browser",
          );
    },
    stop: () => {
      const stopped = stop_background_sync();
      return stopped
        ? create_success_result(true)
        : create_failure_result("Background sync was not running");
    },
    get_status: (): LocalSyncStatus => ({
      is_running: state.is_running,
      has_pending_changes: state.has_pending_changes,
      is_online: state.is_online,
    }),
    set_remote_sync_in_progress: (value: boolean) => {
      set_pulling_from_remote(value);
      return create_success_result(true);
    },
    configure_orchestrator: (sync_orchestrator: SyncOrchestratorPort) =>
      configure_orchestrator(sync_orchestrator),
    configure_restoration_handlers: (handlers: SyncRestorationHandlers) =>
      configure_restoration_handlers(handlers),
    has_pending_changes: () => state.has_pending_changes,
    flush_pending_changes,
  };
}
