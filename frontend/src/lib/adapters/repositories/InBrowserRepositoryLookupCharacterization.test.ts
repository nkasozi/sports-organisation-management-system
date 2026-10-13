import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { get_activity_repository } from "./InBrowserActivityRepository";
import { get_calendar_token_repository } from "./InBrowserCalendarTokenRepository";
import { InBrowserCompetitionFormatRepository } from "./InBrowserCompetitionFormatRepository";
import {
  fail_fake_table,
  FAKE_TABLE_FAILURE_MESSAGE,
  get_fake_table,
  reset_fake_database,
  seed_fake_table,
} from "./InBrowserRepositoryFakeDatabase.test_support";
import { row } from "./InBrowserRepositoryFilterCases.test_support";

vi.mock("./database", async () => {
  const support =
    await import("./InBrowserRepositoryFakeDatabase.test_support");
  return { get_database: () => support.fake_database };
});

const RAW_FAILURE = `Error: ${FAKE_TABLE_FAILURE_MESSAGE}`;

describe("InBrowser repository lookups", () => {
  let warn_spy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    reset_fake_database();
    warn_spy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warn_spy.mockRestore();
  });

  it("finds activities by source and reports missing or failing lookups", async () => {
    seed_fake_table("activities", [
      row("a1", { source_type: "fixture", source_id: "f1" }),
    ]);
    const repository = get_activity_repository();
    const found = await repository.find_by_source("fixture", "f1");
    const missing = await repository.find_by_source("fixture", "f2");
    fail_fake_table("activities");
    const failed = await repository.find_by_source("fixture", "f1");

    expect(found.success && found.data.id).toBe("a1");
    expect(missing.success).toBe(false);
    expect(failed).toEqual({
      success: false,
      error: "Failed to find activity by source",
    });
    expect(warn_spy).toHaveBeenCalledWith(
      "[ActivityRepository] Failed to find activity by source",
      expect.objectContaining({
        event: "repository_find_activity_by_source_failed",
        error: RAW_FAILURE,
        error_code: "repository_storage_operation_failed",
      }),
    );
  });

  it("finds only active calendar tokens by token value", async () => {
    seed_fake_table("calendar_tokens", [
      row("k1", { token: "abc", is_active: true, access_count: 1 }),
      row("k2", { token: "off", is_active: false, access_count: 0 }),
    ]);
    const repository = get_calendar_token_repository();

    const found = await repository.find_by_token("abc" as never);
    const inactive = await repository.find_by_token("off" as never);

    expect(found.success && found.data.id).toBe("k1");
    expect(inactive.success).toBe(false);
  });

  it("records access and deactivates tokens, including inactive ones", async () => {
    seed_fake_table("calendar_tokens", [
      row("k2", { token: "off", is_active: false, access_count: 2 }),
    ]);
    const repository = get_calendar_token_repository();

    const accessed = await repository.record_access("off" as never);
    const deactivated = await repository.deactivate_token("off" as never);
    const missing = await repository.record_access("none" as never);
    const missing_deactivate = await repository.deactivate_token(
      "none" as never,
    );

    expect(accessed.success && accessed.data.access_count).toBe(3);
    expect(accessed.success && accessed.data.last_accessed_at).not.toBe("");
    expect(deactivated.success && deactivated.data.is_active).toBe(false);
    expect(get_fake_table("calendar_tokens").rows[0].access_count).toBe(3);
    expect(missing).toEqual({ success: false, error: "Token not found" });
    expect(missing_deactivate).toEqual({
      success: false,
      error: "Token not found",
    });
  });

  it("reports calendar token storage failures with error messages", async () => {
    fail_fake_table("calendar_tokens");
    const repository = get_calendar_token_repository();
    const message = FAKE_TABLE_FAILURE_MESSAGE;

    expect(await repository.find_by_token("abc" as never)).toEqual({
      success: false,
      error: "Failed to find token",
    });
    expect(await repository.record_access("abc" as never)).toEqual({
      success: false,
      error: "Failed to record access",
    });
    expect(await repository.deactivate_token("abc" as never)).toEqual({
      success: false,
      error: "Failed to deactivate token",
    });
    expect(warn_spy).toHaveBeenCalledWith(
      "[CalendarTokenRepository] Failed to deactivate token",
      expect.objectContaining({
        event: "repository_deactivate_token_failed",
        error: RAW_FAILURE,
        error_code: "repository_storage_operation_failed",
      }),
    );
  });

  it("queries competition formats by type, code and active status", async () => {
    seed_fake_table("competition_formats", [
      row("f1", {
        name: "Zeta",
        code: "Z",
        format_type: "league",
        status: "active",
      }),
      row("f2", {
        name: "Alpha",
        code: "A",
        format_type: "league",
        status: "active",
      }),
      row("f3", {
        name: "Beta",
        code: "B",
        format_type: "league",
        status: "inactive",
      }),
    ]);
    const repository = new InBrowserCompetitionFormatRepository();

    const by_type = await repository.find_by_format_type("league");
    const by_code = await repository.find_by_code("B");
    const missing = await repository.find_by_code("Q");
    const active = await repository.find_active_formats();

    expect(by_type.success && by_type.data.map((f) => f.id)).toEqual([
      "f1",
      "f2",
    ]);
    expect(by_code.success && by_code.data.id).toBe("f3");
    expect(missing.success).toBe(false);
    expect(active.success && active.data.map((f) => f.id)).toEqual([
      "f2",
      "f1",
    ]);
  });

  it("reports competition format failures with raw errors", async () => {
    fail_fake_table("competition_formats");
    const repository = new InBrowserCompetitionFormatRepository();

    expect(await repository.find_by_format_type("league")).toEqual({
      success: false,
      error: "Failed to find formats by type",
    });
    expect(await repository.find_by_code("A")).toEqual({
      success: false,
      error: "Failed to find format by code",
    });
    expect(await repository.find_active_formats()).toEqual({
      success: false,
      error: "Failed to find active formats",
    });
  });
});
