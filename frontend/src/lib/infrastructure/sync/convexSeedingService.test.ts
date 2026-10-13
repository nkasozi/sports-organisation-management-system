import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  is_convex_client_available,
  try_seed_all_tables_from_convex,
} from "./convexSeedingService";
import {
  create_mock_convex_records,
  reset_seeding_test_state,
  use_convex_query,
} from "./convexSeedingService.test_support";

vi.mock("$lib/adapters/repositories/database", async () =>
  (await import("./convexSeedingService.test_support")).create_database_mock(),
);
vi.mock("./convexSyncService", async () =>
  (
    await import("./convexSeedingService.test_support")
  ).create_sync_service_mock(),
);

describe("is_convex_client_available", () => {
  beforeEach(() => {
    reset_seeding_test_state();
  });

  it("returns false when convex client is unavailable", () => {
    const result = is_convex_client_available();
    expect(result).toBe(false);
  });

  it("returns true when convex client exists", () => {
    use_convex_query(() => Promise.resolve([]));
    const result = is_convex_client_available();
    expect(result).toBe(true);
  });
});

describe("try_seed_all_tables_from_convex", () => {
  let progress_messages: Array<{ message: string; percentage: number }>;
  let on_progress: (message: string, percentage: number) => void;

  beforeEach(() => {
    reset_seeding_test_state();
    progress_messages = [];
    on_progress = (message: string, percentage: number) => {
      progress_messages.push({ message, percentage });
    };
  });

  it("returns failure when convex client is not available", async () => {
    const result = await try_seed_all_tables_from_convex(on_progress);

    expect(result.success).toBe(false);
    expect(result.data_source).toBe("none");
    expect(result.tables_fetched).toBe(0);
    expect(result.total_records).toBe(0);
  });

  it("seeds all tables successfully from convex", async () => {
    use_convex_query((_name: string, args: Record<string, unknown>) =>
      Promise.resolve(create_mock_convex_records(args.table_name as string, 5)),
    );

    const result = await try_seed_all_tables_from_convex(on_progress);

    expect(result.success).toBe(true);
    expect(result.data_source).toBe("convex");
    expect(result.tables_fetched).toBe(5);
    expect(result.total_records).toBe(25);
    expect(result.failed_tables).toEqual([]);
  });

  it("reports progress for each table", async () => {
    use_convex_query(() => Promise.resolve([]));

    await try_seed_all_tables_from_convex(on_progress);

    expect(progress_messages.length).toBe(5);
    for (const msg of progress_messages) {
      expect(msg.message).toContain("Pulling");
      expect(msg.message).toContain("from server");
    }
  });

  it("returns failure when convex returns no data", async () => {
    use_convex_query(() => Promise.resolve([]));

    const result = await try_seed_all_tables_from_convex(on_progress);

    expect(result.success).toBe(false);
    expect(result.total_records).toBe(0);
  });
});
