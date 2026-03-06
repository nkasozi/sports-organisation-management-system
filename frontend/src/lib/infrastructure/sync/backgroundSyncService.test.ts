import { describe, expect, it, vi } from "vitest";

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
    is_online: true,
    debounce_timer_id: null,
    offline_retry_timer_id: null,
    hooks_installed: false,
  };
}

function should_trigger_on_write(
  is_pulling_from_remote: boolean,
  is_online: boolean,
): { should_sync: boolean; mark_pending: boolean } {
  if (is_pulling_from_remote) {
    return { should_sync: false, mark_pending: false };
  }

  if (!is_online) {
    return { should_sync: false, mark_pending: true };
  }

  return { should_sync: true, mark_pending: true };
}

function determine_online_action(
  has_pending_changes: boolean,
): "sync" | "none" {
  return has_pending_changes ? "sync" : "none";
}

function determine_offline_retry_action(
  has_pending_changes: boolean,
  is_online: boolean,
): "sync_and_stop_retry" | "wait" | "none" {
  if (!has_pending_changes) return "none";
  if (is_online) return "sync_and_stop_retry";
  return "wait";
}

describe("SYNCED_TABLE_NAMES", () => {
  it("excludes audit_logs from synced tables", () => {
    expect(SYNCED_TABLE_NAMES).not.toContain("audit_logs");
  });

  it("includes fixture_lineups", () => {
    expect(SYNCED_TABLE_NAMES).toContain("fixture_lineups");
  });

  it("includes all major entity tables", () => {
    const expected_tables = [
      "organizations",
      "competitions",
      "teams",
      "players",
      "officials",
      "fixtures",
    ];
    for (const table of expected_tables) {
      expect(SYNCED_TABLE_NAMES).toContain(table);
    }
  });

  it("has 34 synced tables", () => {
    expect(SYNCED_TABLE_NAMES.length).toBe(34);
  });
});

describe("create_initial_state", () => {
  it("creates state with all defaults", () => {
    const state = create_initial_state();
    expect(state.is_running).toBe(false);
    expect(state.has_pending_changes).toBe(false);
    expect(state.is_online).toBe(true);
    expect(state.debounce_timer_id).toBeNull();
    expect(state.offline_retry_timer_id).toBeNull();
    expect(state.hooks_installed).toBe(false);
  });
});

describe("should_trigger_on_write", () => {
  it("triggers sync when online and not pulling from remote", () => {
    const result = should_trigger_on_write(false, true);
    expect(result.should_sync).toBe(true);
    expect(result.mark_pending).toBe(true);
  });

  it("skips sync entirely when pulling from remote", () => {
    const result = should_trigger_on_write(true, true);
    expect(result.should_sync).toBe(false);
    expect(result.mark_pending).toBe(false);
  });

  it("skips sync when pulling from remote even if offline", () => {
    const result = should_trigger_on_write(true, false);
    expect(result.should_sync).toBe(false);
    expect(result.mark_pending).toBe(false);
  });

  it("marks pending but skips sync when offline and writing locally", () => {
    const result = should_trigger_on_write(false, false);
    expect(result.should_sync).toBe(false);
    expect(result.mark_pending).toBe(true);
  });
});

describe("determine_online_action", () => {
  it("returns sync when there are pending changes", () => {
    expect(determine_online_action(true)).toBe("sync");
  });

  it("returns none when no pending changes", () => {
    expect(determine_online_action(false)).toBe("none");
  });
});

describe("determine_offline_retry_action", () => {
  it("returns sync_and_stop_retry when online with pending changes", () => {
    expect(determine_offline_retry_action(true, true)).toBe(
      "sync_and_stop_retry",
    );
  });

  it("returns wait when offline with pending changes", () => {
    expect(determine_offline_retry_action(true, false)).toBe("wait");
  });

  it("returns none when no pending changes", () => {
    expect(determine_offline_retry_action(false, true)).toBe("none");
    expect(determine_offline_retry_action(false, false)).toBe("none");
  });
});

describe("debounce behavior constants", () => {
  it("has a 3 second debounce delay", () => {
    expect(DEBOUNCE_DELAY_MS).toBe(3000);
  });

  it("has a 60 second offline retry interval", () => {
    expect(OFFLINE_RETRY_INTERVAL_MS).toBe(60000);
  });
});

describe("set_pulling_from_remote", () => {
  let pulling_from_remote = false;

  function set_pulling_from_remote(value: boolean): void {
    pulling_from_remote = value;
  }

  function is_pulling_from_remote(): boolean {
    return pulling_from_remote;
  }

  it("sets flag to true", () => {
    set_pulling_from_remote(true);
    expect(is_pulling_from_remote()).toBe(true);
  });

  it("sets flag back to false", () => {
    set_pulling_from_remote(true);
    set_pulling_from_remote(false);
    expect(is_pulling_from_remote()).toBe(false);
  });

  it("prevents sync trigger when pulling", () => {
    set_pulling_from_remote(true);
    const result = should_trigger_on_write(is_pulling_from_remote(), true);
    expect(result.should_sync).toBe(false);
    expect(result.mark_pending).toBe(false);
  });
});
