import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  create_convex_realtime_sync,
  type ConvexRealtimeSync,
  type RealtimeSyncDependencies,
  type TableChangeInfo,
} from "./convexRealtimeSync";

function create_mock_subscription(): { unsubscribe: ReturnType<typeof vi.fn> } {
  return { unsubscribe: vi.fn() };
}

function create_mock_subscribable_client(): RealtimeSyncDependencies["subscribable_client"] & {
  onUpdate: ReturnType<typeof vi.fn>;
} {
  return {
    onUpdate: vi.fn().mockReturnValue(create_mock_subscription()),
  };
}

function create_mock_pull_table(): RealtimeSyncDependencies["pull_table"] {
  return vi.fn().mockResolvedValue({ success: true, records_pulled: 0 });
}

function create_dependencies(
  overrides: Partial<RealtimeSyncDependencies> = {},
): RealtimeSyncDependencies {
  return {
    subscribable_client: create_mock_subscribable_client(),
    pull_table: create_mock_pull_table(),
    table_names: ["teams", "players"],
    ...overrides,
  };
}

describe("ConvexRealtimeSync", () => {
  let sync_service: ConvexRealtimeSync;
  let deps: RealtimeSyncDependencies;

  beforeEach(() => {
    deps = create_dependencies();
    sync_service = create_convex_realtime_sync(deps);
  });

  afterEach(() => {
    sync_service.stop();
  });

  describe("start", () => {
    it("creates subscriptions for each table", () => {
      const started = sync_service.start();

      expect(started).toBe(true);
      expect(deps.subscribable_client.onUpdate).toHaveBeenCalledTimes(2);
    });

    it("passes correct query reference and args for each table", () => {
      sync_service.start();

      const calls = (deps.subscribable_client.onUpdate as ReturnType<typeof vi.fn>).mock.calls;
      expect(calls[0][1]).toEqual({ table_name: "teams" });
      expect(calls[1][1]).toEqual({ table_name: "players" });
    });

    it("returns false when already started", () => {
      sync_service.start();
      const second_start = sync_service.start();

      expect(second_start).toBe(false);
    });

    it("reports running after start", () => {
      sync_service.start();

      expect(sync_service.is_running()).toBe(true);
    });
  });

  describe("stop", () => {
    it("unsubscribes from all table subscriptions", () => {
      const mock_sub_1 = create_mock_subscription();
      const mock_sub_2 = create_mock_subscription();
      const client = create_mock_subscribable_client();
      client.onUpdate
        .mockReturnValueOnce(mock_sub_1)
        .mockReturnValueOnce(mock_sub_2);

      const local_deps = create_dependencies({ subscribable_client: client });
      const local_sync = create_convex_realtime_sync(local_deps);
      local_sync.start();

      const stopped = local_sync.stop();

      expect(stopped).toBe(true);
      expect(mock_sub_1.unsubscribe).toHaveBeenCalledOnce();
      expect(mock_sub_2.unsubscribe).toHaveBeenCalledOnce();
    });

    it("returns false when not running", () => {
      const stopped = sync_service.stop();

      expect(stopped).toBe(false);
    });

    it("reports not running after stop", () => {
      sync_service.start();
      sync_service.stop();

      expect(sync_service.is_running()).toBe(false);
    });
  });

  describe("change detection", () => {
    it("does not trigger pull on first callback (initial snapshot)", () => {
      const client = create_mock_subscribable_client();
      const pull_table = create_mock_pull_table();
      const local_deps = create_dependencies({
        subscribable_client: client,
        pull_table,
      });
      const local_sync = create_convex_realtime_sync(local_deps);
      local_sync.start();

      const callback = client.onUpdate.mock.calls[0][2];
      callback({
        table_name: "teams",
        record_count: 5,
        latest_modified_at: "2024-06-15T12:00:00.000Z",
      });

      expect(pull_table).not.toHaveBeenCalled();
    });

    it("triggers pull when latest_timestamp changes", () => {
      const client = create_mock_subscribable_client();
      const pull_table = create_mock_pull_table();
      const local_deps = create_dependencies({
        subscribable_client: client,
        pull_table,
      });
      const local_sync = create_convex_realtime_sync(local_deps);
      local_sync.start();

      const callback = client.onUpdate.mock.calls[0][2];

      callback({
        table_name: "teams",
        record_count: 5,
        latest_modified_at: "2024-06-15T12:00:00.000Z",
      });

      callback({
        table_name: "teams",
        record_count: 6,
        latest_modified_at: "2024-06-15T13:00:00.000Z",
      });

      expect(pull_table).toHaveBeenCalledWith(
        "teams",
        "2024-06-15T12:00:00.000Z",
      );
    });

    it("does not trigger pull when latest_timestamp is unchanged", () => {
      const client = create_mock_subscribable_client();
      const pull_table = create_mock_pull_table();
      const local_deps = create_dependencies({
        subscribable_client: client,
        pull_table,
      });
      const local_sync = create_convex_realtime_sync(local_deps);
      local_sync.start();

      const callback = client.onUpdate.mock.calls[0][2];

      callback({
        table_name: "teams",
        record_count: 5,
        latest_modified_at: "2024-06-15T12:00:00.000Z",
      });

      callback({
        table_name: "teams",
        record_count: 5,
        latest_modified_at: "2024-06-15T12:00:00.000Z",
      });

      expect(pull_table).not.toHaveBeenCalled();
    });

    it("passes previous timestamp as since_timestamp to pull_table", () => {
      const client = create_mock_subscribable_client();
      const pull_table = create_mock_pull_table();
      const local_deps = create_dependencies({
        subscribable_client: client,
        pull_table,
      });
      const local_sync = create_convex_realtime_sync(local_deps);
      local_sync.start();

      const callback = client.onUpdate.mock.calls[0][2];

      callback({
        table_name: "teams",
        record_count: 3,
        latest_modified_at: "2024-01-01T00:00:00.000Z",
      });

      callback({
        table_name: "teams",
        record_count: 4,
        latest_modified_at: "2024-06-15T12:00:00.000Z",
      });

      expect(pull_table).toHaveBeenCalledWith(
        "teams",
        "2024-01-01T00:00:00.000Z",
      );
    });

    it("tracks each table independently", () => {
      const client = create_mock_subscribable_client();
      const pull_table = create_mock_pull_table();
      const local_deps = create_dependencies({
        subscribable_client: client,
        pull_table,
      });
      const local_sync = create_convex_realtime_sync(local_deps);
      local_sync.start();

      const teams_callback = client.onUpdate.mock.calls[0][2];
      const players_callback = client.onUpdate.mock.calls[1][2];

      teams_callback({
        table_name: "teams",
        record_count: 3,
        latest_modified_at: "2024-01-01T00:00:00.000Z",
      });

      players_callback({
        table_name: "players",
        record_count: 10,
        latest_modified_at: "2024-02-01T00:00:00.000Z",
      });

      teams_callback({
        table_name: "teams",
        record_count: 4,
        latest_modified_at: "2024-06-15T12:00:00.000Z",
      });

      expect(pull_table).toHaveBeenCalledTimes(1);
      expect(pull_table).toHaveBeenCalledWith(
        "teams",
        "2024-01-01T00:00:00.000Z",
      );
    });
  });

  describe("get_watched_tables", () => {
    it("returns the list of watched table names", () => {
      expect(sync_service.get_watched_tables()).toEqual(["teams", "players"]);
    });
  });

  describe("get_table_status", () => {
    it("returns status for each watched table after receiving data", () => {
      const client = create_mock_subscribable_client();
      const local_deps = create_dependencies({ subscribable_client: client });
      const local_sync = create_convex_realtime_sync(local_deps);
      local_sync.start();

      const callback = client.onUpdate.mock.calls[0][2];
      callback({
        table_name: "teams",
        record_count: 5,
        latest_modified_at: "2024-06-15T12:00:00.000Z",
      });

      const status = local_sync.get_table_status("teams");

      expect(status).toEqual({
        table_name: "teams",
        remote_record_count: 5,
        remote_latest_timestamp: "2024-06-15T12:00:00.000Z",
        pull_count: 0,
      });
    });

    it("returns null for unknown table", () => {
      expect(sync_service.get_table_status("nonexistent")).toBeNull();
    });

    it("increments pull_count after each triggered pull", () => {
      const client = create_mock_subscribable_client();
      const pull_table = create_mock_pull_table();
      const local_deps = create_dependencies({
        subscribable_client: client,
        pull_table,
      });
      const local_sync = create_convex_realtime_sync(local_deps);
      local_sync.start();

      const callback = client.onUpdate.mock.calls[0][2];

      callback({
        table_name: "teams",
        record_count: 5,
        latest_modified_at: "2024-01-01T00:00:00.000Z",
      });

      callback({
        table_name: "teams",
        record_count: 6,
        latest_modified_at: "2024-02-01T00:00:00.000Z",
      });

      callback({
        table_name: "teams",
        record_count: 7,
        latest_modified_at: "2024-03-01T00:00:00.000Z",
      });

      const status = local_sync.get_table_status("teams");
      expect(status?.pull_count).toBe(2);
    });
  });

  describe("error handling", () => {
    it("continues operating when pull_table fails", async () => {
      const client = create_mock_subscribable_client();
      const pull_table = vi.fn().mockRejectedValue(new Error("Network error"));
      const local_deps = create_dependencies({
        subscribable_client: client,
        pull_table,
      });
      const local_sync = create_convex_realtime_sync(local_deps);
      local_sync.start();

      const callback = client.onUpdate.mock.calls[0][2];

      callback({
        table_name: "teams",
        record_count: 5,
        latest_modified_at: "2024-01-01T00:00:00.000Z",
      });

      callback({
        table_name: "teams",
        record_count: 6,
        latest_modified_at: "2024-02-01T00:00:00.000Z",
      });

      expect(local_sync.is_running()).toBe(true);
    });
  });

  describe("restart", () => {
    it("can be stopped and restarted cleanly", () => {
      const client = create_mock_subscribable_client();
      const local_deps = create_dependencies({ subscribable_client: client });
      const local_sync = create_convex_realtime_sync(local_deps);

      local_sync.start();
      expect(client.onUpdate).toHaveBeenCalledTimes(2);

      local_sync.stop();
      expect(local_sync.is_running()).toBe(false);

      local_sync.start();
      expect(client.onUpdate).toHaveBeenCalledTimes(4);
      expect(local_sync.is_running()).toBe(true);
    });
  });
});
