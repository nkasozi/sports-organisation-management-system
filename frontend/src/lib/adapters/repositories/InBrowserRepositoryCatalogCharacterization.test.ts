import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { InBrowserGameEventTypeRepository } from "./InBrowserGameEventTypeRepository";
import { InBrowserGameOfficialRoleRepository } from "./InBrowserGameOfficialRoleRepository";
import {
  fail_fake_table,
  FAKE_TABLE_FAILURE_MESSAGE,
  reset_fake_database,
  seed_fake_table,
} from "./InBrowserRepositoryFakeDatabase.test_support";
import { ids_of, row } from "./InBrowserRepositoryFilterCases.test_support";

vi.mock("./database", async () => {
  const support =
    await import("./InBrowserRepositoryFakeDatabase.test_support");
  return { get_database: () => support.fake_database };
});

const RAW_FAILURE = `Error: ${FAKE_TABLE_FAILURE_MESSAGE}`;

describe("InBrowser catalog repositories", () => {
  let warn_spy: ReturnType<typeof vi.spyOn>;
  let error_spy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    reset_fake_database();
    warn_spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    warn_spy.mockRestore();
    error_spy.mockRestore();
  });

  it("orders and paginates official roles and lists sport and head roles", async () => {
    seed_fake_table("game_official_roles", [
      row("r3", { sport_id: "s1", display_order: 3, is_head_official: true }),
      row("r1", { sport_id: "", display_order: 1, is_head_official: false }),
      row("r2", { sport_id: "s2", display_order: 2, is_head_official: true }),
    ]);
    const repository = new InBrowserGameOfficialRoleRepository();

    const page = await repository.find_all_with_filter(void 0, {
      page_number: 1,
      page_size: 2,
      sort_by: "id",
      sort_direction: "desc",
    });
    const filtered = await repository.find_all_with_filter({ sport_id: "s2" });

    expect(ids_of(page)).toEqual(["r1", "r2"]);
    expect(page.success && page.data.total_count).toBe(3);
    expect(ids_of(filtered)).toEqual(["r2"]);
    expect(ids_of(await repository.find_by_sport("s1" as never))).toEqual([
      "r1",
      "r3",
    ]);
    expect(ids_of(await repository.find_head_officials())).toEqual([
      "r2",
      "r3",
    ]);
  });

  it("reports official role failures", async () => {
    fail_fake_table("game_official_roles");
    const repository = new InBrowserGameOfficialRoleRepository();

    expect(await repository.find_all_with_filter()).toEqual({
      success: false,
      error: "Failed to filter game official roles",
    });
    expect(await repository.find_by_sport("s1" as never)).toEqual({
      success: false,
      error: "Failed to find roles by sport",
    });
    expect(await repository.find_head_officials()).toEqual({
      success: false,
      error: "Failed to find head officials",
    });
    expect(warn_spy).toHaveBeenCalledWith(
      "[GameOfficialRoleRepository] Failed to filter game official roles",
      expect.objectContaining({
        event: "repository_filter_game_official_roles_failed",
        error: RAW_FAILURE,
        error_code: "repository_storage_operation_failed",
      }),
    );
    expect(error_spy).toHaveBeenCalledWith(
      "[GameOfficialRoleRepository] find_by_sport failed",
      expect.objectContaining({
        event: "repository_find_by_sport_failed",
        error: RAW_FAILURE,
        error_code: "repository_storage_operation_failed",
      }),
    );
    expect(error_spy).toHaveBeenCalledWith(
      "[GameOfficialRoleRepository] find_head_officials failed",
      expect.objectContaining({
        event: "repository_find_head_officials_failed",
        error: RAW_FAILURE,
        error_code: "repository_storage_operation_failed",
      }),
    );
  });

  it("queries game event types by sport, category, code and scoring", async () => {
    seed_fake_table("game_event_types", [
      row("t2", {
        sport_id: "",
        category: "score",
        code: "G",
        affects_score: true,
        display_order: 2,
      }),
      row("t1", {
        sport_id: "s1",
        category: "card",
        code: "Y",
        affects_score: false,
        display_order: 1,
      }),
      row("t3", {
        sport_id: "s2",
        category: "score",
        code: "P",
        affects_score: true,
        display_order: 3,
      }),
    ]);
    const repository = new InBrowserGameEventTypeRepository();

    const page = await repository.find_all_with_filter(
      {},
      { page_number: 2, page_size: 2 },
    );
    const by_code = await repository.find_by_code("P");

    expect(ids_of(page)).toEqual(["t3"]);
    expect(ids_of(await repository.find_by_sport("s1" as never))).toEqual([
      "t1",
      "t2",
    ]);
    expect(ids_of(await repository.find_by_category("score"))).toEqual([
      "t2",
      "t3",
    ]);
    expect(by_code.success && by_code.data.id).toBe("t3");
    expect((await repository.find_by_code("Z")).success).toBe(false);
    expect(ids_of(await repository.find_scoring_events())).toEqual([
      "t2",
      "t3",
    ]);
  });

  it("reports game event type failures", async () => {
    fail_fake_table("game_event_types");
    const repository = new InBrowserGameEventTypeRepository();

    expect(await repository.find_all_with_filter()).toEqual({
      success: false,
      error: "Failed to filter game event types",
    });
    expect(await repository.find_by_sport("s1" as never)).toEqual({
      success: false,
      error: "Failed to find event types by sport",
    });
    expect(await repository.find_by_category("score")).toEqual({
      success: false,
      error: "Failed to find event types by category",
    });
    expect(await repository.find_by_code("G")).toEqual({
      success: false,
      error: "Failed to find event type by code",
    });
    expect(await repository.find_scoring_events()).toEqual({
      success: false,
      error: "Failed to find scoring events",
    });
  });
});
