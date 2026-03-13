import { describe, expect, it, vi, beforeEach } from "vitest";

const EPOCH_TIMESTAMP = "1970-01-01T00:00:00.000Z";

interface RemoteTableState {
  record_count: number;
  latest_modified_at: string | null;
}

interface LocalRecord {
  id: string;
  updated_at?: string;
  created_at?: string;
  [key: string]: unknown;
}

interface ConflictFromServer {
  local_id: string;
  local_data: Record<string, unknown>;
  local_version: number;
  remote_data: Record<string, unknown>;
  remote_version: number;
  remote_updated_at: string;
  remote_updated_by: string | null;
}

interface PushResult {
  success: boolean;
  records_pushed: number;
  error: string | null;
  conflicts: ConflictFromServer[];
}

interface PullResult {
  success: boolean;
  records_pulled: number;
  error: string | null;
}

interface ConvexClient {
  mutation: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  query: (name: string, args: Record<string, unknown>) => Promise<unknown>;
}

interface MockTable {
  toArray: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
}

function get_local_latest_modified_at(
  all_records: Array<{ id: string; updated_at?: string; created_at?: string }>,
): string {
  return all_records.reduce((max, record) => {
    const timestamp = record.updated_at || record.created_at || EPOCH_TIMESTAMP;
    return timestamp > max ? timestamp : max;
  }, EPOCH_TIMESTAMP);
}

function create_mock_convex_client(): ConvexClient & {
  mutation: ReturnType<typeof vi.fn>;
  query: ReturnType<typeof vi.fn>;
} {
  return {
    mutation: vi.fn(),
    query: vi.fn(),
  };
}

function create_mock_table(records: LocalRecord[] = []): MockTable {
  return {
    toArray: vi.fn().mockResolvedValue(records),
    get: vi.fn().mockImplementation(async (id: string) => {
      return records.find((r) => r.id === id) || null;
    }),
    put: vi.fn().mockResolvedValue(undefined),
  };
}

function create_record(
  overrides: Partial<LocalRecord> & { id: string },
): LocalRecord {
  return {
    updated_at: "2024-01-15T10:00:00.000Z",
    created_at: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

async function push_table_to_convex(
  convex_client: ConvexClient,
  table_name: string,
  all_records: LocalRecord[],
  remote_latest_modified_at: string | null,
  detect_conflicts: boolean = true,
): Promise<PushResult> {
  const remote_cutoff = remote_latest_modified_at || EPOCH_TIMESTAMP;
  const server_is_empty = !remote_latest_modified_at;

  const records_to_push = server_is_empty
    ? all_records
    : all_records.filter((record) => {
        const record_modified_at =
          record.updated_at || record.created_at || EPOCH_TIMESTAMP;
        return record_modified_at > remote_cutoff;
      });

  if (records_to_push.length === 0) {
    return { success: true, records_pushed: 0, error: null, conflicts: [] };
  }

  const batch_size = 25;
  let total_pushed = 0;
  const all_conflicts: ConflictFromServer[] = [];

  try {
    for (let i = 0; i < records_to_push.length; i += batch_size) {
      const batch = records_to_push.slice(i, i + batch_size);

      const batch_records = batch.map((record) => ({
        local_id: record.id,
        data: record,
        version: Date.now(),
      }));

      const result = (await convex_client.mutation("sync:batch_upsert", {
        table_name,
        records: batch_records,
        detect_conflicts,
      })) as {
        success: boolean;
        error?: string;
        message?: string;
        results: Array<{
          local_id: string;
          success: boolean;
          action: string;
        }>;
        has_conflicts: boolean;
        conflicts: ConflictFromServer[];
      };

      if (!result.success) {
        const auth_error_message = result.error
          ? `${result.error}: ${result.message || "unknown"}`
          : `Server rejected batch (success=false, results: ${result.results?.length ?? 0})`;
        return {
          success: false,
          records_pushed: total_pushed,
          error: auth_error_message,
          conflicts: all_conflicts,
        };
      }

      if (result.has_conflicts && result.conflicts.length > 0) {
        all_conflicts.push(...result.conflicts);
      }

      const non_conflict_count = result.results.filter(
        (r) => r.action !== "conflict_detected",
      ).length;
      total_pushed += non_conflict_count;
    }
  } catch (error) {
    const error_message =
      error instanceof Error ? error.message : String(error);
    return {
      success: false,
      records_pushed: total_pushed,
      error: error_message,
      conflicts: all_conflicts,
    };
  }

  return {
    success: true,
    records_pushed: total_pushed,
    error: null,
    conflicts: all_conflicts,
  };
}

async function pull_table_from_convex(
  convex_client: ConvexClient,
  table: MockTable,
  table_name: string,
  local_latest_modified_at: string,
): Promise<PullResult> {
  try {
    const remote_changes = (await convex_client.query(
      "sync:get_changes_since",
      {
        table_name,
        since_timestamp: local_latest_modified_at,
      },
    )) as Array<{
      _id: string;
      local_id: string;
      synced_at: string;
      version: number;
      updated_at?: string;
      [key: string]: unknown;
    }>;

    if (!remote_changes || remote_changes.length === 0) {
      return { success: true, records_pulled: 0, error: null };
    }

    let records_pulled = 0;

    for (const remote_record of remote_changes) {
      const local_id = remote_record.local_id;
      const existing_local = await table.get(local_id);

      const local_data = { ...remote_record } as Record<string, unknown>;
      delete local_data._id;
      delete local_data.local_id;
      delete local_data.synced_at;
      delete local_data.version;
      local_data.id = local_id;

      if (existing_local) {
        const local_timestamp =
          existing_local.updated_at ||
          existing_local.created_at ||
          EPOCH_TIMESTAMP;
        const remote_timestamp =
          (remote_record.updated_at as string) ||
          remote_record.synced_at ||
          EPOCH_TIMESTAMP;

        if (remote_timestamp > local_timestamp) {
          await table.put(local_data);
          records_pulled++;
        }
      } else {
        await table.put(local_data);
        records_pulled++;
      }
    }

    return { success: true, records_pulled, error: null };
  } catch (error) {
    const error_message =
      error instanceof Error ? error.message : String(error);
    return { success: false, records_pulled: 0, error: error_message };
  }
}

describe("get_local_latest_modified_at", () => {
  it("returns EPOCH when given empty array", () => {
    const result = get_local_latest_modified_at([]);
    expect(result).toBe(EPOCH_TIMESTAMP);
  });

  it("returns the single record updated_at when only one record exists", () => {
    const records = [
      create_record({ id: "1", updated_at: "2024-06-15T12:00:00.000Z" }),
    ];
    const result = get_local_latest_modified_at(records);
    expect(result).toBe("2024-06-15T12:00:00.000Z");
  });

  it("returns the latest updated_at from multiple records", () => {
    const records = [
      create_record({ id: "1", updated_at: "2024-01-01T00:00:00.000Z" }),
      create_record({ id: "2", updated_at: "2024-06-15T12:00:00.000Z" }),
      create_record({ id: "3", updated_at: "2024-03-10T08:00:00.000Z" }),
    ];
    const result = get_local_latest_modified_at(records);
    expect(result).toBe("2024-06-15T12:00:00.000Z");
  });

  it("falls back to created_at when updated_at is missing", () => {
    const records = [
      { id: "1", created_at: "2024-05-20T10:00:00.000Z" },
      { id: "2", created_at: "2024-08-01T14:00:00.000Z" },
    ];
    const result = get_local_latest_modified_at(records);
    expect(result).toBe("2024-08-01T14:00:00.000Z");
  });

  it("prefers updated_at over created_at when both exist", () => {
    const records = [
      create_record({
        id: "1",
        updated_at: "2024-09-01T00:00:00.000Z",
        created_at: "2024-01-01T00:00:00.000Z",
      }),
    ];
    const result = get_local_latest_modified_at(records);
    expect(result).toBe("2024-09-01T00:00:00.000Z");
  });

  it("handles mix of records with and without timestamps", () => {
    const records = [
      { id: "1" },
      create_record({ id: "2", updated_at: "2024-04-01T00:00:00.000Z" }),
      { id: "3", created_at: "2024-02-01T00:00:00.000Z" },
    ];
    const result = get_local_latest_modified_at(records);
    expect(result).toBe("2024-04-01T00:00:00.000Z");
  });

  it("returns EPOCH when all records have no timestamps", () => {
    const records = [{ id: "1" }, { id: "2" }, { id: "3" }];
    const result = get_local_latest_modified_at(records);
    expect(result).toBe(EPOCH_TIMESTAMP);
  });

  it("handles records where created_at is newer than updated_at in other records", () => {
    const records = [
      create_record({ id: "1", updated_at: "2024-01-10T00:00:00.000Z" }),
      { id: "2", created_at: "2024-12-25T00:00:00.000Z" },
    ];
    const result = get_local_latest_modified_at(records);
    expect(result).toBe("2024-12-25T00:00:00.000Z");
  });
});

describe("push_table_to_convex", () => {
  let mock_client: ReturnType<typeof create_mock_convex_client>;

  beforeEach(() => {
    mock_client = create_mock_convex_client();
  });

  it("pushes all records when server is empty (null remote_latest_modified_at)", async () => {
    const records = [create_record({ id: "r1" }), create_record({ id: "r2" })];

    mock_client.mutation.mockResolvedValue({
      success: true,
      results: [
        { local_id: "r1", success: true, action: "created" },
        { local_id: "r2", success: true, action: "created" },
      ],
      has_conflicts: false,
      conflicts: [],
    });

    const result = await push_table_to_convex(
      mock_client,
      "players",
      records,
      null,
    );

    expect(result.success).toBe(true);
    expect(result.records_pushed).toBe(2);
    expect(result.error).toBeNull();
    expect(result.conflicts).toHaveLength(0);
    expect(mock_client.mutation).toHaveBeenCalledTimes(1);
  });

  it("filters records older than remote_latest_modified_at", async () => {
    const old_record = create_record({
      id: "old",
      updated_at: "2024-01-01T00:00:00.000Z",
    });
    const new_record = create_record({
      id: "new",
      updated_at: "2024-06-15T12:00:00.000Z",
    });

    mock_client.mutation.mockResolvedValue({
      success: true,
      results: [{ local_id: "new", success: true, action: "updated" }],
      has_conflicts: false,
      conflicts: [],
    });

    const result = await push_table_to_convex(
      mock_client,
      "players",
      [old_record, new_record],
      "2024-03-01T00:00:00.000Z",
    );

    expect(result.success).toBe(true);
    expect(result.records_pushed).toBe(1);

    const mutation_args = mock_client.mutation.mock.calls[0][1] as {
      records: Array<{ local_id: string }>;
    };
    expect(mutation_args.records).toHaveLength(1);
    expect(mutation_args.records[0].local_id).toBe("new");
  });

  it("returns zero pushed when all records are older than remote", async () => {
    const records = [
      create_record({ id: "r1", updated_at: "2024-01-01T00:00:00.000Z" }),
      create_record({ id: "r2", updated_at: "2024-02-01T00:00:00.000Z" }),
    ];

    const result = await push_table_to_convex(
      mock_client,
      "players",
      records,
      "2024-12-01T00:00:00.000Z",
    );

    expect(result.success).toBe(true);
    expect(result.records_pushed).toBe(0);
    expect(mock_client.mutation).not.toHaveBeenCalled();
  });

  it("batches records in groups of 25", async () => {
    const records = Array.from({ length: 30 }, (_, i) =>
      create_record({
        id: `r${i}`,
        updated_at: "2024-06-01T00:00:00.000Z",
      }),
    );

    mock_client.mutation
      .mockResolvedValueOnce({
        success: true,
        results: Array.from({ length: 25 }, (_, i) => ({
          local_id: `r${i}`,
          success: true,
          action: "created",
        })),
        has_conflicts: false,
        conflicts: [],
      })
      .mockResolvedValueOnce({
        success: true,
        results: Array.from({ length: 5 }, (_, i) => ({
          local_id: `r${25 + i}`,
          success: true,
          action: "created",
        })),
        has_conflicts: false,
        conflicts: [],
      });

    const result = await push_table_to_convex(
      mock_client,
      "players",
      records,
      null,
    );

    expect(result.success).toBe(true);
    expect(result.records_pushed).toBe(30);
    expect(mock_client.mutation).toHaveBeenCalledTimes(2);

    const first_batch_args = mock_client.mutation.mock.calls[0][1] as {
      records: Array<{ local_id: string }>;
    };
    const second_batch_args = mock_client.mutation.mock.calls[1][1] as {
      records: Array<{ local_id: string }>;
    };
    expect(first_batch_args.records).toHaveLength(25);
    expect(second_batch_args.records).toHaveLength(5);
  });

  it("reports conflicts from server without counting them as pushed", async () => {
    const records = [create_record({ id: "r1" }), create_record({ id: "r2" })];

    const mock_conflict: ConflictFromServer = {
      local_id: "r2",
      local_data: { id: "r2", name: "local" },
      local_version: 1,
      remote_data: { id: "r2", name: "remote" },
      remote_version: 2,
      remote_updated_at: "2024-06-01T00:00:00.000Z",
      remote_updated_by: "user-1",
    };

    mock_client.mutation.mockResolvedValue({
      success: true,
      results: [
        { local_id: "r1", success: true, action: "created" },
        { local_id: "r2", success: false, action: "conflict_detected" },
      ],
      has_conflicts: true,
      conflicts: [mock_conflict],
    });

    const result = await push_table_to_convex(
      mock_client,
      "players",
      records,
      null,
    );

    expect(result.success).toBe(true);
    expect(result.records_pushed).toBe(1);
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].local_id).toBe("r2");
  });

  it("returns error when mutation throws", async () => {
    const records = [create_record({ id: "r1" })];
    mock_client.mutation.mockRejectedValue(new Error("Network timeout"));

    const result = await push_table_to_convex(
      mock_client,
      "players",
      records,
      null,
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe("Network timeout");
    expect(result.records_pushed).toBe(0);
  });

  it("uses created_at for filtering when updated_at is missing", async () => {
    const record_with_only_created_at: LocalRecord = {
      id: "r1",
      created_at: "2024-08-01T00:00:00.000Z",
    };

    mock_client.mutation.mockResolvedValue({
      success: true,
      results: [{ local_id: "r1", success: true, action: "created" }],
      has_conflicts: false,
      conflicts: [],
    });

    const result = await push_table_to_convex(
      mock_client,
      "players",
      [record_with_only_created_at],
      "2024-05-01T00:00:00.000Z",
    );

    expect(result.success).toBe(true);
    expect(result.records_pushed).toBe(1);
  });

  it("passes detect_conflicts flag to mutation", async () => {
    const records = [create_record({ id: "r1" })];

    mock_client.mutation.mockResolvedValue({
      success: true,
      results: [{ local_id: "r1", success: true, action: "created" }],
      has_conflicts: false,
      conflicts: [],
    });

    await push_table_to_convex(mock_client, "players", records, null, false);

    const mutation_args = mock_client.mutation.mock.calls[0][1] as {
      detect_conflicts: boolean;
    };
    expect(mutation_args.detect_conflicts).toBe(false);
  });

  it("pushes empty records array returns zero pushed", async () => {
    const result = await push_table_to_convex(mock_client, "players", [], null);

    expect(result.success).toBe(true);
    expect(result.records_pushed).toBe(0);
    expect(mock_client.mutation).not.toHaveBeenCalled();
  });
});

describe("pull_table_from_convex", () => {
  let mock_client: ReturnType<typeof create_mock_convex_client>;

  beforeEach(() => {
    mock_client = create_mock_convex_client();
  });

  it("returns zero pulled when no remote changes exist", async () => {
    const mock_table = create_mock_table();
    mock_client.query.mockResolvedValue([]);

    const result = await pull_table_from_convex(
      mock_client,
      mock_table,
      "players",
      EPOCH_TIMESTAMP,
    );

    expect(result.success).toBe(true);
    expect(result.records_pulled).toBe(0);
  });

  it("returns zero pulled when remote changes is null", async () => {
    const mock_table = create_mock_table();
    mock_client.query.mockResolvedValue(null);

    const result = await pull_table_from_convex(
      mock_client,
      mock_table,
      "players",
      EPOCH_TIMESTAMP,
    );

    expect(result.success).toBe(true);
    expect(result.records_pulled).toBe(0);
  });

  it("inserts new records that dont exist locally", async () => {
    const mock_table = create_mock_table([]);
    mock_table.get.mockResolvedValue(null);

    mock_client.query.mockResolvedValue([
      {
        _id: "convex-1",
        local_id: "player-1",
        synced_at: "2024-06-01T00:00:00.000Z",
        version: 1,
        name: "New Player",
        updated_at: "2024-06-01T00:00:00.000Z",
      },
    ]);

    const result = await pull_table_from_convex(
      mock_client,
      mock_table,
      "players",
      EPOCH_TIMESTAMP,
    );

    expect(result.success).toBe(true);
    expect(result.records_pulled).toBe(1);
    expect(mock_table.put).toHaveBeenCalledTimes(1);

    const put_args = mock_table.put.mock.calls[0][0] as Record<string, unknown>;
    expect(put_args.id).toBe("player-1");
    expect(put_args.name).toBe("New Player");
    expect(put_args._id).toBeUndefined();
    expect(put_args.local_id).toBeUndefined();
    expect(put_args.synced_at).toBeUndefined();
    expect(put_args.version).toBeUndefined();
  });

  it("updates existing record when remote is newer", async () => {
    const existing_local = create_record({
      id: "player-1",
      updated_at: "2024-01-01T00:00:00.000Z",
      name: "Old Name",
    });

    const mock_table = create_mock_table([existing_local]);

    mock_client.query.mockResolvedValue([
      {
        _id: "convex-1",
        local_id: "player-1",
        synced_at: "2024-06-01T00:00:00.000Z",
        version: 2,
        name: "Updated Name",
        updated_at: "2024-06-01T00:00:00.000Z",
      },
    ]);

    const result = await pull_table_from_convex(
      mock_client,
      mock_table,
      "players",
      "2024-01-01T00:00:00.000Z",
    );

    expect(result.success).toBe(true);
    expect(result.records_pulled).toBe(1);
    expect(mock_table.put).toHaveBeenCalledTimes(1);
  });

  it("skips existing record when local is newer than remote", async () => {
    const existing_local = create_record({
      id: "player-1",
      updated_at: "2024-12-01T00:00:00.000Z",
      name: "Locally Modified",
    });

    const mock_table = create_mock_table([existing_local]);

    mock_client.query.mockResolvedValue([
      {
        _id: "convex-1",
        local_id: "player-1",
        synced_at: "2024-06-01T00:00:00.000Z",
        version: 2,
        name: "Older Remote",
        updated_at: "2024-06-01T00:00:00.000Z",
      },
    ]);

    const result = await pull_table_from_convex(
      mock_client,
      mock_table,
      "players",
      EPOCH_TIMESTAMP,
    );

    expect(result.success).toBe(true);
    expect(result.records_pulled).toBe(0);
    expect(mock_table.put).not.toHaveBeenCalled();
  });

  it("queries convex with the local latest timestamp as since", async () => {
    const mock_table = create_mock_table();
    mock_client.query.mockResolvedValue([]);

    await pull_table_from_convex(
      mock_client,
      mock_table,
      "players",
      "2024-06-15T10:30:00.000Z",
    );

    expect(mock_client.query).toHaveBeenCalledWith("sync:get_changes_since", {
      table_name: "players",
      since_timestamp: "2024-06-15T10:30:00.000Z",
    });
  });

  it("returns error when query throws", async () => {
    const mock_table = create_mock_table();
    mock_client.query.mockRejectedValue(new Error("Server unavailable"));

    const result = await pull_table_from_convex(
      mock_client,
      mock_table,
      "players",
      EPOCH_TIMESTAMP,
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe("Server unavailable");
    expect(result.records_pulled).toBe(0);
  });

  it("strips convex metadata fields before saving locally", async () => {
    const mock_table = create_mock_table([]);
    mock_table.get.mockResolvedValue(null);

    mock_client.query.mockResolvedValue([
      {
        _id: "convex-abc",
        local_id: "player-1",
        synced_at: "2024-06-01T00:00:00.000Z",
        version: 5,
        name: "Test Player",
        team: "Team A",
        updated_at: "2024-06-01T00:00:00.000Z",
      },
    ]);

    await pull_table_from_convex(
      mock_client,
      mock_table,
      "players",
      EPOCH_TIMESTAMP,
    );

    const saved_record = mock_table.put.mock.calls[0][0] as Record<
      string,
      unknown
    >;
    expect(saved_record._id).toBeUndefined();
    expect(saved_record.local_id).toBeUndefined();
    expect(saved_record.synced_at).toBeUndefined();
    expect(saved_record.version).toBeUndefined();
    expect(saved_record.id).toBe("player-1");
    expect(saved_record.name).toBe("Test Player");
    expect(saved_record.team).toBe("Team A");
  });

  it("handles multiple remote changes with mixed insert and skip", async () => {
    const existing_local = create_record({
      id: "player-1",
      updated_at: "2024-12-01T00:00:00.000Z",
    });

    const mock_table = create_mock_table([existing_local]);
    mock_table.get.mockImplementation(async (id: string) => {
      switch (id) {
        case "player-1":
          return existing_local;
        case "player-2":
          return null;
        default:
          return null;
      }
    });

    mock_client.query.mockResolvedValue([
      {
        _id: "c1",
        local_id: "player-1",
        synced_at: "2024-06-01T00:00:00.000Z",
        version: 1,
        updated_at: "2024-06-01T00:00:00.000Z",
      },
      {
        _id: "c2",
        local_id: "player-2",
        synced_at: "2024-06-01T00:00:00.000Z",
        version: 1,
        updated_at: "2024-06-01T00:00:00.000Z",
      },
    ]);

    const result = await pull_table_from_convex(
      mock_client,
      mock_table,
      "players",
      EPOCH_TIMESTAMP,
    );

    expect(result.success).toBe(true);
    expect(result.records_pulled).toBe(1);
    expect(mock_table.put).toHaveBeenCalledTimes(1);
  });
});

describe("sync direction detection", () => {
  function determine_sync_direction(
    local_latest: string,
    remote_latest: string,
  ): "local_ahead" | "remote_ahead" | "in_sync" {
    if (local_latest > remote_latest) return "local_ahead";
    if (remote_latest > local_latest) return "remote_ahead";
    return "in_sync";
  }

  it("detects local ahead when local timestamp is newer", () => {
    const result = determine_sync_direction(
      "2024-06-15T12:00:00.000Z",
      "2024-01-01T00:00:00.000Z",
    );
    expect(result).toBe("local_ahead");
  });

  it("detects remote ahead when remote timestamp is newer", () => {
    const result = determine_sync_direction(
      "2024-01-01T00:00:00.000Z",
      "2024-06-15T12:00:00.000Z",
    );
    expect(result).toBe("remote_ahead");
  });

  it("detects in sync when timestamps match", () => {
    const result = determine_sync_direction(
      "2024-06-15T12:00:00.000Z",
      "2024-06-15T12:00:00.000Z",
    );
    expect(result).toBe("in_sync");
  });

  it("detects local ahead when remote has null (treated as EPOCH)", () => {
    const maybe_null: string | null = null;
    const remote_latest_or_epoch = maybe_null || EPOCH_TIMESTAMP;
    const result = determine_sync_direction(
      "2024-01-01T00:00:00.000Z",
      remote_latest_or_epoch,
    );
    expect(result).toBe("local_ahead");
  });

  it("detects in sync when both are EPOCH (both empty)", () => {
    const result = determine_sync_direction(EPOCH_TIMESTAMP, EPOCH_TIMESTAMP);
    expect(result).toBe("in_sync");
  });
});

describe("sync_all_tables shape", () => {
  it("SyncResult has expected structure", () => {
    const mock_result = {
      success: true,
      tables_synced: 5,
      records_pushed: 10,
      records_pulled: 3,
      errors: [],
      duration_ms: 500,
      conflicts: [],
    };

    expect(mock_result.success).toBe(true);
    expect(mock_result.tables_synced).toBe(5);
    expect(mock_result.records_pushed).toBe(10);
    expect(mock_result.records_pulled).toBe(3);
    expect(mock_result.errors).toHaveLength(0);
    expect(mock_result.conflicts).toHaveLength(0);
  });
});

describe("ConvexSyncManager", () => {
  it("creates with default config", async () => {
    const { ConvexSyncManager } = await import("./convexSyncService");
    const manager = new ConvexSyncManager();
    const config = manager.get_config();

    expect(config.convex_url).toBe("");
    expect(config.sync_interval_ms).toBe(30000);
    expect(config.direction).toBe("bidirectional");
    expect(config.enabled_tables.length).toBeGreaterThan(0);
  });

  it("creates with custom config", async () => {
    const { ConvexSyncManager } = await import("./convexSyncService");
    const manager = new ConvexSyncManager({
      convex_url: "https://test.convex.cloud",
      sync_interval_ms: 60000,
      direction: "push",
    });
    const config = manager.get_config();

    expect(config.convex_url).toBe("https://test.convex.cloud");
    expect(config.sync_interval_ms).toBe(60000);
    expect(config.direction).toBe("push");
  });

  it("reports not configured when no client is set", async () => {
    const { ConvexSyncManager } = await import("./convexSyncService");
    const manager = new ConvexSyncManager();
    expect(manager.is_configured()).toBe(false);
  });

  it("reports configured after client and url are set", async () => {
    const { ConvexSyncManager } = await import("./convexSyncService");
    const manager = new ConvexSyncManager({
      convex_url: "https://test.convex.cloud",
    });
    manager.set_convex_client(create_mock_convex_client());
    expect(manager.is_configured()).toBe(true);
  });

  it("returns error result when syncing without configured client", async () => {
    const { ConvexSyncManager } = await import("./convexSyncService");
    const manager = new ConvexSyncManager();

    const result = await manager.sync_now();

    expect(result.success).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].error).toContain("not configured");
  });

  it("reports syncing status correctly", async () => {
    const { ConvexSyncManager } = await import("./convexSyncService");
    const manager = new ConvexSyncManager();

    expect(manager.get_sync_status()).toBe("idle");
  });

  it("updates config via update_config", async () => {
    const { ConvexSyncManager } = await import("./convexSyncService");
    const manager = new ConvexSyncManager();

    manager.update_config({ sync_interval_ms: 5000 });
    const config = manager.get_config();

    expect(config.sync_interval_ms).toBe(5000);
  });

  it("returns defensive copy of config", async () => {
    const { ConvexSyncManager } = await import("./convexSyncService");
    const manager = new ConvexSyncManager();

    const config1 = manager.get_config();
    const config2 = manager.get_config();

    expect(config1).not.toBe(config2);
    expect(config1).toEqual(config2);
  });
});

describe("get_last_sync_timestamp", () => {
  it("returns EPOCH_TIMESTAMP", async () => {
    const { get_last_sync_timestamp } = await import("./convexSyncService");
    const result = get_last_sync_timestamp();
    expect(result).toBe("1970-01-01T00:00:00.000Z");
  });
});

describe("reset_sync_metadata", () => {
  it("removes convex_sync_metadata from localStorage", async () => {
    const mock_remove_item = vi.fn();
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: mock_remove_item,
    });

    const { reset_sync_metadata } = await import("./convexSyncService");
    reset_sync_metadata();

    expect(mock_remove_item).toHaveBeenCalledWith("convex_sync_metadata");

    vi.unstubAllGlobals();
  });
});

describe("initialize_sync_manager", () => {
  it("creates a new manager with provided config", async () => {
    const { initialize_sync_manager } = await import("./convexSyncService");
    const manager = initialize_sync_manager({
      convex_url: "https://test.convex.cloud",
      sync_interval_ms: 15000,
    });

    const config = manager.get_config();
    expect(config.convex_url).toBe("https://test.convex.cloud");
    expect(config.sync_interval_ms).toBe(15000);
  });

  it("replaces the singleton instance", async () => {
    const { initialize_sync_manager, get_sync_manager } =
      await import("./convexSyncService");
    const manager = initialize_sync_manager({
      convex_url: "https://new-instance.convex.cloud",
    });

    const retrieved = get_sync_manager();
    expect(retrieved).toBe(manager);
  });
});

describe("push and pull record timestamp edge cases", () => {
  let mock_client: ReturnType<typeof create_mock_convex_client>;

  beforeEach(() => {
    mock_client = create_mock_convex_client();
  });

  it("push treats record with no timestamps as EPOCH (always older than any remote)", async () => {
    const record_without_timestamps: LocalRecord = { id: "r1" };

    const result = await push_table_to_convex(
      mock_client,
      "players",
      [record_without_timestamps],
      "2024-01-01T00:00:00.000Z",
    );

    expect(result.records_pushed).toBe(0);
    expect(mock_client.mutation).not.toHaveBeenCalled();
  });

  it("push treats record with only created_at correctly for filtering", async () => {
    const record: LocalRecord = {
      id: "r1",
      created_at: "2024-06-01T00:00:00.000Z",
    };

    mock_client.mutation.mockResolvedValue({
      success: true,
      results: [{ local_id: "r1", success: true, action: "created" }],
      has_conflicts: false,
      conflicts: [],
    });

    const push_newer = await push_table_to_convex(
      mock_client,
      "players",
      [record],
      "2024-01-01T00:00:00.000Z",
    );
    expect(push_newer.records_pushed).toBe(1);

    mock_client.mutation.mockClear();

    const push_older = await push_table_to_convex(
      mock_client,
      "players",
      [record],
      "2024-12-01T00:00:00.000Z",
    );
    expect(push_older.records_pushed).toBe(0);
  });

  it("pull uses created_at as fallback for local timestamp comparison", async () => {
    const existing_local = {
      id: "player-1",
      created_at: "2024-09-01T00:00:00.000Z",
    };

    const mock_table = create_mock_table([existing_local]);

    mock_client.query.mockResolvedValue([
      {
        _id: "c1",
        local_id: "player-1",
        synced_at: "2024-06-01T00:00:00.000Z",
        version: 1,
        updated_at: "2024-06-01T00:00:00.000Z",
      },
    ]);

    const result = await pull_table_from_convex(
      mock_client,
      mock_table,
      "players",
      EPOCH_TIMESTAMP,
    );

    expect(result.records_pulled).toBe(0);
    expect(mock_table.put).not.toHaveBeenCalled();
  });
});

function is_auth_error(error_message: string | null): boolean {
  if (!error_message) return false;
  return (
    error_message.includes("authentication_required") ||
    error_message.includes("unauthorized") ||
    error_message.includes("Server rejected")
  );
}

describe("is_auth_error", () => {
  it("returns true for authentication_required error", () => {
    expect(is_auth_error("authentication_required: Not authenticated")).toBe(
      true,
    );
  });

  it("returns true for unauthorized error", () => {
    expect(
      is_auth_error('unauthorized: Role "player" does not have permission'),
    ).toBe(true);
  });

  it("returns false for null error", () => {
    expect(is_auth_error(null)).toBe(false);
  });

  it("returns false for non-auth errors", () => {
    expect(is_auth_error("Network timeout")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(is_auth_error("")).toBe(false);
  });

  it("returns true for Server rejected message", () => {
    expect(
      is_auth_error("Server rejected batch (success=false, results: 0)"),
    ).toBe(true);
  });
});

describe("push_table_to_convex auth error handling", () => {
  let mock_client: ReturnType<typeof create_mock_convex_client>;

  beforeEach(() => {
    mock_client = create_mock_convex_client();
  });

  it("returns failure with auth error when server returns authentication_required", async () => {
    const records = [create_record({ id: "r1" })];

    mock_client.mutation.mockResolvedValue({
      success: false,
      error: "authentication_required",
      message: "Not authenticated",
      results: [],
      has_conflicts: false,
      conflicts: [],
    });

    const result = await push_table_to_convex(
      mock_client,
      "players",
      records,
      null,
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe("authentication_required: Not authenticated");
    expect(result.records_pushed).toBe(0);
  });

  it("returns failure with auth error when server returns unauthorized", async () => {
    const records = [create_record({ id: "r1" })];

    mock_client.mutation.mockResolvedValue({
      success: false,
      error: "unauthorized",
      message: 'Role "player" does not have "create" permission',
      results: [],
      has_conflicts: false,
      conflicts: [],
    });

    const result = await push_table_to_convex(
      mock_client,
      "players",
      records,
      null,
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("unauthorized");
    expect(result.records_pushed).toBe(0);
  });

  it("stops processing remaining batches when auth fails on first batch", async () => {
    const records = Array.from({ length: 30 }, (_, i) =>
      create_record({ id: `r${i}` }),
    );

    mock_client.mutation.mockResolvedValue({
      success: false,
      error: "authentication_required",
      message: "Not authenticated",
      results: [],
      has_conflicts: false,
      conflicts: [],
    });

    const result = await push_table_to_convex(
      mock_client,
      "players",
      records,
      null,
    );

    expect(result.success).toBe(false);
    expect(mock_client.mutation).toHaveBeenCalledTimes(1);
  });

  it("returns failure when server returns success=false WITHOUT error field (old deployment)", async () => {
    const records = [create_record({ id: "r1" })];

    mock_client.mutation.mockResolvedValue({
      success: false,
      results: [],
      has_conflicts: false,
      conflicts: [],
    });

    const result = await push_table_to_convex(
      mock_client,
      "players",
      records,
      null,
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("Server rejected");
    expect(result.records_pushed).toBe(0);
  });

  it("Server rejected error is detected as auth error", () => {
    expect(
      is_auth_error("Server rejected batch (success=false, results: 0)"),
    ).toBe(true);
  });
});

describe("get_remote_state_for_table with SyncHints", () => {
  function get_remote_state_for_table(
    table_name: string,
    remote_timestamp_cache: Record<string, string | null> | undefined,
    use_fresh_timestamps: boolean | undefined,
    fetcher: (t: string) => RemoteTableState,
  ): RemoteTableState {
    const cached = remote_timestamp_cache?.[table_name];
    if (cached !== undefined && !use_fresh_timestamps) {
      return { record_count: 0, latest_modified_at: cached ?? null };
    }
    return fetcher(table_name);
  }

  it("returns cached value when cache contains the table and fresh not requested", () => {
    const cache = { players: "2024-06-01T00:00:00.000Z" };
    const fetcher = vi.fn(() => ({ record_count: 10, latest_modified_at: "2024-01-01T00:00:00.000Z" }));

    const result = get_remote_state_for_table("players", cache, false, fetcher);

    expect(result.latest_modified_at).toBe("2024-06-01T00:00:00.000Z");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("fetches fresh when use_fresh_timestamps is true even if cache present", () => {
    const cache = { players: "2024-06-01T00:00:00.000Z" };
    const fetcher = vi.fn(() => ({ record_count: 5, latest_modified_at: "2024-09-01T00:00:00.000Z" }));

    const result = get_remote_state_for_table("players", cache, true, fetcher);

    expect(result.latest_modified_at).toBe("2024-09-01T00:00:00.000Z");
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("fetches fresh when table not in cache", () => {
    const cache = { competitions: "2024-01-01T00:00:00.000Z" };
    const fetcher = vi.fn(() => ({ record_count: 3, latest_modified_at: "2024-05-01T00:00:00.000Z" }));

    const result = get_remote_state_for_table("players", cache, false, fetcher);

    expect(result.latest_modified_at).toBe("2024-05-01T00:00:00.000Z");
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("returns null latest when cache has null value for table", () => {
    const cache: Record<string, string | null> = { players: null };
    const fetcher = vi.fn(() => ({ record_count: 0, latest_modified_at: null }));

    const result = get_remote_state_for_table("players", cache, false, fetcher);

    expect(result.latest_modified_at).toBeNull();
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("fetches fresh when no cache provided at all", () => {
    const fetcher = vi.fn(() => ({ record_count: 2, latest_modified_at: "2024-03-01T00:00:00.000Z" }));

    const result = get_remote_state_for_table("players", undefined, undefined, fetcher);

    expect(result.latest_modified_at).toBe("2024-03-01T00:00:00.000Z");
    expect(fetcher).toHaveBeenCalledOnce();
  });
});

describe("skip-when-in-sync optimization", () => {
  function should_skip_table(
    local_latest: string,
    remote_latest: string,
    direction: string,
  ): boolean {
    const local_is_ahead = local_latest > remote_latest;
    const remote_is_ahead = remote_latest > local_latest;
    const are_in_sync = !local_is_ahead && !remote_is_ahead && remote_latest !== EPOCH_TIMESTAMP;
    return are_in_sync && direction === "bidirectional";
  }

  it("skips bidirectional sync when local and remote timestamps are equal", () => {
    expect(should_skip_table(
      "2024-06-01T00:00:00.000Z",
      "2024-06-01T00:00:00.000Z",
      "bidirectional",
    )).toBe(true);
  });

  it("does not skip when local is ahead", () => {
    expect(should_skip_table(
      "2024-09-01T00:00:00.000Z",
      "2024-06-01T00:00:00.000Z",
      "bidirectional",
    )).toBe(false);
  });

  it("does not skip when remote is ahead", () => {
    expect(should_skip_table(
      "2024-01-01T00:00:00.000Z",
      "2024-06-01T00:00:00.000Z",
      "bidirectional",
    )).toBe(false);
  });

  it("does not skip for push direction even if timestamps match", () => {
    expect(should_skip_table(
      "2024-06-01T00:00:00.000Z",
      "2024-06-01T00:00:00.000Z",
      "push",
    )).toBe(false);
  });

  it("does not skip for pull direction even if timestamps match", () => {
    expect(should_skip_table(
      "2024-06-01T00:00:00.000Z",
      "2024-06-01T00:00:00.000Z",
      "pull",
    )).toBe(false);
  });

  it("does not skip when both timestamps are EPOCH (never synced table)", () => {
    expect(should_skip_table(EPOCH_TIMESTAMP, EPOCH_TIMESTAMP, "bidirectional")).toBe(false);
  });
});
