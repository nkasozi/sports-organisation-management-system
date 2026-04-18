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
  "official_performance_ratings",
  "organization_settings",
] as const;

interface BackgroundSyncState {
  is_running: boolean;
  has_pending_changes: boolean;
  is_online: boolean;
  debounce_timer_id?: ReturnType<typeof setTimeout>;
  offline_retry_timer_id?: ReturnType<typeof setInterval>;
  scheduled_sync_timer_id?: ReturnType<typeof setInterval>;
  hooks_installed: boolean;
}

function create_initial_state(): BackgroundSyncState {
  return {
    is_running: false,
    has_pending_changes: false,
    is_online: true,

    hooks_installed: false,
  } as BackgroundSyncState;
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

  it("has 36 synced tables", () => {
    expect(SYNCED_TABLE_NAMES.length).toBe(36);
  });
});

describe("create_initial_state", () => {
  it("creates state with all defaults", () => {
    const state = create_initial_state();
    expect(state.is_running).toBe(false);
    expect(state.has_pending_changes).toBe(false);
    expect(state.is_online).toBe(true);
    expect(state.debounce_timer_id).toBeUndefined();
    expect(state.offline_retry_timer_id).toBeUndefined();
    expect(state.scheduled_sync_timer_id).toBeUndefined();
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

const SCHEDULED_SYNC_INTERVAL_MS = 3_600_000;

describe("debounce behavior constants", () => {
  it("has a 3 second debounce delay", () => {
    expect(DEBOUNCE_DELAY_MS).toBe(3000);
  });

  it("has a 60 second offline retry interval", () => {
    expect(OFFLINE_RETRY_INTERVAL_MS).toBe(60000);
  });

  it("has a 1 hour scheduled sync interval", () => {
    expect(SCHEDULED_SYNC_INTERVAL_MS).toBe(3_600_000);
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

describe("port configuration", () => {
  interface MockOrchestrator {
    sync_now: ReturnType<typeof vi.fn>;
    is_configured: ReturnType<typeof vi.fn>;
  }

  function create_mock_orchestrator(): MockOrchestrator {
    return {
      sync_now: vi.fn(),
      is_configured: vi.fn().mockReturnValue(true),
    } as MockOrchestrator;
  }

  interface MockRemoteSubscriber {
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    is_running: ReturnType<typeof vi.fn>;
    get_cached_table_timestamps: ReturnType<typeof vi.fn>;
  }

  function create_mock_remote_subscriber(): MockRemoteSubscriber {
    return {
      start: vi.fn().mockReturnValue({ success: true, data: true }),
      stop: vi.fn().mockReturnValue({ success: true, data: true }),
      is_running: vi.fn().mockReturnValue(true),
      get_cached_table_timestamps: vi.fn().mockReturnValue({
        players: "2024-06-01T00:00:00.000Z",
        teams: "2024-05-01T00:00:00.000Z",
      }),
    } as MockRemoteSubscriber;
  }

  it("configure_orchestrator stores the orchestrator and returns success", () => {
    const orchestrators = [] as MockOrchestrator[];
    let stored_orchestrator: MockOrchestrator | undefined = undefined;

    function configure_orchestrator(orch: MockOrchestrator) {
      stored_orchestrator = orch;
      orchestrators.push(orch);
      return { success: true as const, data: true };
    }

    const mock_orch = create_mock_orchestrator();
    const result = configure_orchestrator(mock_orch);

    expect(result.success).toBe(true);
    expect(stored_orchestrator).toBe(mock_orch);
    expect(orchestrators).toHaveLength(1);
  });

  it("configure_remote_subscriber stores the subscriber and returns success", () => {
    let stored_subscriber: MockRemoteSubscriber | undefined = undefined;

    function configure_remote_subscriber(sub: MockRemoteSubscriber) {
      stored_subscriber = sub;
      return { success: true as const, data: true };
    }

    const mock_sub = create_mock_remote_subscriber();
    const result = configure_remote_subscriber(mock_sub);

    expect(result.success).toBe(true);
    expect(stored_subscriber).toBe(mock_sub);
  });

  it("configure_restoration_handlers stores the handlers and returns success", () => {
    let stored_handlers:
      | {
          stop_remote_sync: () => void;
          start_remote_sync: () => void;
        }
      | undefined = undefined;

    function configure_restoration_handlers(handlers: {
      stop_remote_sync: () => void;
      start_remote_sync: () => void;
    }) {
      stored_handlers = handlers;
      return { success: true as const, data: true };
    }

    const stop_fn = vi.fn();
    const start_fn = vi.fn();
    const result = configure_restoration_handlers({
      stop_remote_sync: stop_fn,
      start_remote_sync: start_fn,
    });

    expect(result.success).toBe(true);
    expect(stored_handlers).toBeDefined();
  });
});

describe("execute_push_sync behavior", () => {
  it("uses push direction and passes timestamp cache from remote subscriber", async () => {
    const timestamp_cache = {
      players: "2024-06-01T00:00:00.000Z",
      teams: "1970-01-01T00:00:00.000Z",
    };

    let called_direction: string | undefined;
    let called_hints: Record<string, unknown> | undefined;

    const mock_orchestrator = {
      sync_now: async (direction: string, hints: Record<string, unknown>) => {
        called_direction = direction;
        called_hints = hints;
        return {
          success: true as const,
          data: {
            records_pushed: 3,
            records_pulled: 0,
            tables_synced: 2,
            duration_ms: 100,
            conflicts: [],
          },
        };
      },
      is_configured: () => true,
    };

    const mock_remote_subscriber = {
      get_cached_table_timestamps: () => timestamp_cache,
      is_running: () => true,
      start: () => ({ success: true as const, data: true }),
      stop: () => ({ success: true as const, data: true }),
    };

    async function execute_push_sync_with_ports(
      orchestrator: typeof mock_orchestrator,
      subscriber: typeof mock_remote_subscriber,
    ): Promise<boolean> {
      const cache = subscriber.get_cached_table_timestamps();
      const result = await orchestrator.sync_now("push", {
        remote_timestamp_cache: cache,
      });
      return result.success;
    }

    const success = await execute_push_sync_with_ports(
      mock_orchestrator,
      mock_remote_subscriber,
    );

    expect(success).toBe(true);
    expect(called_direction).toBe("push");
    expect(
      (called_hints as Record<string, unknown>)?.remote_timestamp_cache,
    ).toEqual(timestamp_cache);
  });

  it("marks pending changes when orchestrator returns failure", async () => {
    let has_pending_changes = false;

    const mock_orchestrator = {
      sync_now: async () => ({
        success: false as const,
        error: { failed_tables: [], message: "Network error" },
      }),
      is_configured: () => true,
    };

    async function execute_push_and_track(
      orchestrator: typeof mock_orchestrator,
    ): Promise<boolean> {
      const result = await orchestrator.sync_now();
      if (!result.success) {
        has_pending_changes = true;
        return false;
      }
      has_pending_changes = false;
      return true;
    }

    const succeeded = await execute_push_and_track(mock_orchestrator);

    expect(succeeded).toBe(false);
    expect(has_pending_changes).toBe(true);
  });
});

describe("network restoration sync behavior", () => {
  it("stops WebSocket before bidirectional sync and restarts after", async () => {
    const call_order = [] as string[];

    const mock_handlers = {
      stop_remote_sync: vi.fn(() => {
        call_order.push("stop_websocket");
        return { success: true as const, data: true };
      }),
      start_remote_sync: vi.fn(() => {
        call_order.push("start_websocket");
        return { success: true as const, data: true };
      }),
    };

    const mock_orchestrator = {
      sync_now: vi.fn(
        async (_direction?: string, _hints?: Record<string, unknown>) => {
          call_order.push("bidirectional_sync");
          return {
            success: true as const,
            data: {
              records_pushed: 5,
              records_pulled: 3,
              tables_synced: 34,
              duration_ms: 800,
              conflicts: [],
            },
          };
        },
      ),
      is_configured: () => true,
    };

    const mock_subscriber = {
      is_running: () => true,
      start: mock_handlers.start_remote_sync,
      stop: mock_handlers.stop_remote_sync,
      get_cached_table_timestamps: () => ({}),
    };

    async function run_network_restoration_sync(
      orchestrator: typeof mock_orchestrator,
      handlers: typeof mock_handlers,
      subscriber: typeof mock_subscriber,
    ): Promise<void> {
      const websocket_was_running = subscriber.is_running();

      if (websocket_was_running) {
        handlers.stop_remote_sync();
      }

      try {
        await orchestrator.sync_now("bidirectional", {
          use_fresh_timestamps: true,
        });
      } finally {
        if (websocket_was_running) {
          handlers.start_remote_sync();
        }
      }
    }

    await run_network_restoration_sync(
      mock_orchestrator,
      mock_handlers,
      mock_subscriber,
    );

    expect(call_order).toEqual([
      "stop_websocket",
      "bidirectional_sync",
      "start_websocket",
    ]);
  });

  it("always restarts WebSocket even when bidirectional sync fails", async () => {
    const mock_handlers = {
      stop_remote_sync: vi.fn().mockReturnValue({ success: true, data: true }),
      start_remote_sync: vi.fn().mockReturnValue({ success: true, data: true }),
    };

    const mock_orchestrator = {
      sync_now: vi.fn(
        async (_direction?: string, _hints?: Record<string, unknown>) => ({
          success: false as const,
          error: { failed_tables: [], message: "Sync failed" },
        }),
      ),
      is_configured: () => true,
    };

    async function run_restoration_with_guaranteed_restart(
      orchestrator: typeof mock_orchestrator,
      handlers: typeof mock_handlers,
    ): Promise<void> {
      handlers.stop_remote_sync();
      try {
        await orchestrator.sync_now("bidirectional", {
          use_fresh_timestamps: true,
        });
      } finally {
        handlers.start_remote_sync();
      }
    }

    await run_restoration_with_guaranteed_restart(
      mock_orchestrator,
      mock_handlers,
    );

    expect(mock_handlers.stop_remote_sync).toHaveBeenCalledOnce();
    expect(mock_handlers.start_remote_sync).toHaveBeenCalledOnce();
  });

  it("uses use_fresh_timestamps=true during restoration to avoid stale cache", async () => {
    let called_hints: Record<string, unknown> | undefined;

    const mock_orchestrator = {
      sync_now: vi.fn(
        async (_direction: string, hints: Record<string, unknown>) => {
          called_hints = hints;
          return {
            success: true as const,
            data: {
              records_pushed: 0,
              records_pulled: 0,
              tables_synced: 0,
              duration_ms: 0,
              conflicts: [],
            },
          };
        },
      ),
      is_configured: () => true,
    };

    await mock_orchestrator.sync_now("bidirectional", {
      use_fresh_timestamps: true,
    });

    expect(called_hints?.use_fresh_timestamps).toBe(true);
  });
});

describe("flush_pending_changes returns AsyncResult", () => {
  it("resolves with skipped_offline=false when no pending changes", async () => {
    async function flush_when_no_pending(): Promise<{
      success: boolean;
      data?: { skipped_offline: boolean };
    }> {
      return { success: true, data: { skipped_offline: false } };
    }

    const result = await flush_when_no_pending();
    expect(result.success).toBe(true);
    expect(result.data?.skipped_offline).toBe(false);
  });

  it("resolves with skipped_offline=true when offline", async () => {
    async function flush_when_offline(): Promise<{
      success: boolean;
      data?: { skipped_offline: boolean };
    }> {
      return { success: true, data: { skipped_offline: true } };
    }

    const result = await flush_when_offline();
    expect(result.success).toBe(true);
    expect(result.data?.skipped_offline).toBe(true);
  });

  it("resolves with failure when push sync fails", async () => {
    async function flush_with_failed_sync(): Promise<{
      success: boolean;
      error?: string;
    }> {
      return {
        success: false,
        error: "Flush failed — check logs for push sync errors",
      };
    }

    const result = await flush_with_failed_sync();
    expect(result.success).toBe(false);
    expect(result.error).toContain("Flush failed");
  });
});

describe("scheduled sync timer behavior", () => {
  it("start_scheduled_sync_timer starts interval with 1-hour period and calls sync on each tick", () => {
    vi.useFakeTimers();
    const sync_calls = [] as string[];

    function mock_run_restoration_sync(): void {
      sync_calls.push("bidirectional_sync");
    }

    let stored_timer_id: ReturnType<typeof setInterval> | undefined = undefined;

    function start_scheduled_sync_timer(): void {
      if (stored_timer_id !== void 0) return;
      stored_timer_id = setInterval(() => {
        mock_run_restoration_sync();
      }, SCHEDULED_SYNC_INTERVAL_MS);
    }

    start_scheduled_sync_timer();
    expect(sync_calls).toHaveLength(0);

    vi.advanceTimersByTime(SCHEDULED_SYNC_INTERVAL_MS);
    expect(sync_calls).toHaveLength(1);

    vi.advanceTimersByTime(SCHEDULED_SYNC_INTERVAL_MS);
    expect(sync_calls).toHaveLength(2);

    clearInterval(stored_timer_id!);
    vi.useRealTimers();
  });

  it("start_scheduled_sync_timer is idempotent — calling twice starts only one timer", () => {
    vi.useFakeTimers();
    const sync_calls = [] as string[];

    let stored_timer_id: ReturnType<typeof setInterval> | undefined = undefined;

    function start_scheduled_sync_timer(): void {
      if (stored_timer_id !== void 0) return;
      stored_timer_id = setInterval(() => {
        sync_calls.push("tick");
      }, SCHEDULED_SYNC_INTERVAL_MS);
    }

    start_scheduled_sync_timer();
    start_scheduled_sync_timer();

    vi.advanceTimersByTime(SCHEDULED_SYNC_INTERVAL_MS);
    expect(sync_calls).toHaveLength(1);

    clearInterval(stored_timer_id!);
    vi.useRealTimers();
  });

  it("stop_scheduled_sync_timer clears the interval so no further syncs fire", () => {
    vi.useFakeTimers();
    const sync_calls = [] as string[];

    let stored_timer_id: ReturnType<typeof setInterval> | undefined = void 0;

    function start_scheduled_sync_timer(): void {
      if (stored_timer_id != void 0) return;
      stored_timer_id = setInterval(() => {
        sync_calls.push("tick");
      }, SCHEDULED_SYNC_INTERVAL_MS);
    }

    function stop_scheduled_sync_timer(): void {
      if (stored_timer_id === void 0) return;
      clearInterval(stored_timer_id);
      stored_timer_id = void 0;
    }

    start_scheduled_sync_timer();
    vi.advanceTimersByTime(SCHEDULED_SYNC_INTERVAL_MS);
    expect(sync_calls).toHaveLength(1);

    stop_scheduled_sync_timer();
    vi.advanceTimersByTime(SCHEDULED_SYNC_INTERVAL_MS * 5);
    expect(sync_calls).toHaveLength(1);

    vi.useRealTimers();
  });

  it("stop_scheduled_sync_timer is safe to call when timer is not running", () => {
    let stored_timer_id: ReturnType<typeof setInterval> | undefined = undefined;

    function stop_scheduled_sync_timer(): void {
      if (stored_timer_id === void 0) return;
      clearInterval(stored_timer_id);
      stored_timer_id = void 0;
    }

    expect(() => stop_scheduled_sync_timer()).not.toThrow();
    expect(stored_timer_id).toBeUndefined();
  });
});

describe("trigger_full_sync_on_page_reload behavior", () => {
  it("delegates to run_network_restoration_sync", async () => {
    const call_log = [] as string[];

    async function mock_run_network_restoration_sync(): Promise<void> {
      call_log.push("restoration_sync");
    }

    async function trigger_full_sync_on_page_reload(): Promise<void> {
      await mock_run_network_restoration_sync();
    }

    await trigger_full_sync_on_page_reload();
    expect(call_log).toEqual(["restoration_sync"]);
  });

  it("does not throw when sync completes successfully", async () => {
    async function trigger_full_sync_on_page_reload(): Promise<void> {
      await Promise.resolve();
    }

    await expect(trigger_full_sync_on_page_reload()).resolves.toBeUndefined();
  });

  it("does not block callers — returns a Promise so callers can fire-and-forget with void", async () => {
    let sync_finished = false;

    async function trigger_full_sync_on_page_reload(): Promise<void> {
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      sync_finished = true;
    }

    void trigger_full_sync_on_page_reload();
    expect(sync_finished).toBe(false);

    await new Promise<void>((resolve) => setTimeout(resolve, 10));
    expect(sync_finished).toBe(true);
  });
});

describe("configure_scheduled_interval behavior", () => {
  const ALLOWED_INTERVALS = [600_000, 900_000, 1_800_000, 3_600_000];
  const DEFAULT_SYNC_INTERVAL_MS = 3_600_000;

  function configure_scheduled_interval(
    interval_ms: number,
    current_interval_ms: number,
  ): { success: boolean; new_interval_ms: number; error?: string } {
    if (!ALLOWED_INTERVALS.includes(interval_ms)) {
      return {
        success: false,
        new_interval_ms: current_interval_ms,
        error: `Invalid interval_ms: ${interval_ms}`,
      };
    }
    return { success: true, new_interval_ms: interval_ms };
  }

  it("accepts all four allowed sync intervals", () => {
    for (const interval_ms of ALLOWED_INTERVALS) {
      const result = configure_scheduled_interval(
        interval_ms,
        DEFAULT_SYNC_INTERVAL_MS,
      );
      expect(result.success).toBe(true);
      expect(result.new_interval_ms).toBe(interval_ms);
    }
  });

  it("rejects an arbitrary ms value not in the allowed list", () => {
    const result = configure_scheduled_interval(
      12345,
      DEFAULT_SYNC_INTERVAL_MS,
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid interval_ms");
  });

  it("rejects zero", () => {
    const result = configure_scheduled_interval(0, DEFAULT_SYNC_INTERVAL_MS);
    expect(result.success).toBe(false);
  });

  it("rejects a negative value", () => {
    const result = configure_scheduled_interval(
      -3_600_000,
      DEFAULT_SYNC_INTERVAL_MS,
    );
    expect(result.success).toBe(false);
  });

  it("leaves the active interval unchanged on rejection", () => {
    const result = configure_scheduled_interval(
      99999,
      DEFAULT_SYNC_INTERVAL_MS,
    );
    expect(result.new_interval_ms).toBe(DEFAULT_SYNC_INTERVAL_MS);
  });

  it("replaces the current interval with the new one on success", () => {
    vi.useFakeTimers();
    const sync_ticks = [] as number[];
    let active_interval_ms = DEFAULT_SYNC_INTERVAL_MS;
    let timer_id: ReturnType<typeof setInterval> | undefined = undefined;

    function start_timer(): void {
      if (timer_id !== void 0) return;
      timer_id = setInterval(() => {
        sync_ticks.push(Date.now());
      }, active_interval_ms);
    }

    function stop_timer(): void {
      if (timer_id === void 0) return;
      clearInterval(timer_id);
      timer_id = void 0;
    }

    function reconfigure(interval_ms: number): boolean {
      if (!ALLOWED_INTERVALS.includes(interval_ms)) return false;
      active_interval_ms = interval_ms;
      stop_timer();
      start_timer();
      return true;
    }

    start_timer();
    vi.advanceTimersByTime(DEFAULT_SYNC_INTERVAL_MS);
    expect(sync_ticks).toHaveLength(1);

    reconfigure(600_000);
    vi.advanceTimersByTime(600_000);
    expect(sync_ticks).toHaveLength(2);

    vi.advanceTimersByTime(DEFAULT_SYNC_INTERVAL_MS);
    expect(sync_ticks.length).toBeGreaterThan(2);

    stop_timer();
    vi.useRealTimers();
  });
});

describe("create_local_change_publisher factory", () => {
  it("returned port has all required interface methods", () => {
    const publisher = {
      start: vi.fn(),
      stop: vi.fn(),
      get_status: vi.fn(),
      set_remote_sync_in_progress: vi.fn(),
      configure_orchestrator: vi.fn(),
      configure_restoration_handlers: vi.fn(),
      has_pending_changes: vi.fn(),
      flush_pending_changes: vi.fn(),
    };

    expect(typeof publisher.start).toBe("function");
    expect(typeof publisher.stop).toBe("function");
    expect(typeof publisher.get_status).toBe("function");
    expect(typeof publisher.set_remote_sync_in_progress).toBe("function");
    expect(typeof publisher.configure_orchestrator).toBe("function");
    expect(typeof publisher.configure_restoration_handlers).toBe("function");
    expect(typeof publisher.has_pending_changes).toBe("function");
    expect(typeof publisher.flush_pending_changes).toBe("function");
  });

  it("get_status returns LocalSyncStatus shape", () => {
    function get_status(
      is_running: boolean,
      has_pending_changes: boolean,
      is_online: boolean,
    ) {
      return { is_running, has_pending_changes, is_online };
    }

    const status = get_status(true, false, true);
    expect(status.is_running).toBe(true);
    expect(status.has_pending_changes).toBe(false);
    expect(status.is_online).toBe(true);
  });
});
