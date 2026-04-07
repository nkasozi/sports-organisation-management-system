import type {
  RemoteChangeSubscriberPort,
  SyncOrchestratorPort,
  SyncRestorationHandlers,
} from "$lib/core/interfaces/ports";

export const DEBOUNCE_DELAY_MS = 3000;
export const OFFLINE_RETRY_INTERVAL_MS = 60000;
export const DEFAULT_SCHEDULED_SYNC_INTERVAL_MS = 3_600_000;

export const SYNCED_TABLE_NAMES = [
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
  "competition_stages",
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
  "official_performance_ratings",
  "organization_settings",
] as const;

export interface BackgroundSyncState {
  is_running: boolean;
  has_pending_changes: boolean;
  is_online: boolean;
  debounce_timer_id: ReturnType<typeof setTimeout> | null;
  offline_retry_timer_id: ReturnType<typeof setInterval> | null;
  scheduled_sync_timer_id: ReturnType<typeof setInterval> | null;
  hooks_installed: boolean;
  is_restoration_sync_in_progress: boolean;
  active_interval_ms: number;
}

function create_initial_state(): BackgroundSyncState {
  return {
    is_running: false,
    has_pending_changes: false,
    is_online: typeof navigator !== "undefined" ? navigator.onLine : true,
    debounce_timer_id: null,
    offline_retry_timer_id: null,
    scheduled_sync_timer_id: null,
    hooks_installed: false,
    is_restoration_sync_in_progress: false,
    active_interval_ms: DEFAULT_SCHEDULED_SYNC_INTERVAL_MS,
  };
}

export const sync_state: BackgroundSyncState = create_initial_state();

export const sync_deps = {
  orchestrator: null as SyncOrchestratorPort | null,
  restoration_handlers: null as SyncRestorationHandlers | null,
  remote_subscriber: null as RemoteChangeSubscriberPort | null,
};

export function reset_sync_state(): void {
  Object.assign(sync_state, create_initial_state());
  sync_deps.orchestrator = null;
  sync_deps.restoration_handlers = null;
  sync_deps.remote_subscriber = null;
}
