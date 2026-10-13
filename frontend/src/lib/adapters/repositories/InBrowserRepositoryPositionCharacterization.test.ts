import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { InBrowserPlayerPositionRepository } from "./InBrowserPlayerPositionRepository";
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

describe("InBrowser player position repository", () => {
  let warn_spy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    reset_fake_database();
    warn_spy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warn_spy.mockRestore();
  });

  it("queries player positions by code, sport, category, availability and filter", async () => {
    seed_fake_table("player_positions", [
      row("p2", {
        name: "Bravo",
        code: "GK",
        sport_type: "hockey",
        category: "goalkeeper",
        is_available: true,
        status: "active",
        display_order: 2,
      }),
      row("p1", {
        name: "Alpha",
        code: "DF",
        sport_type: "hockey",
        category: "defender",
        is_available: false,
        status: "active",
        display_order: 1,
      }),
    ]);
    const repository = new InBrowserPlayerPositionRepository();

    const by_code = await repository.find_by_code("gk");
    const page = await repository.find_by_filter(
      {},
      { sort_by: "name", sort_direction: "desc" },
    );

    expect(by_code.success && by_code.data.id).toBe("p2");
    expect((await repository.find_by_code("zz")).success).toBe(false);
    expect(ids_of(await repository.find_by_sport_type("hockey"))).toEqual([
      "p1",
      "p2",
    ]);
    expect(ids_of(await repository.find_by_category("defender"))).toEqual([
      "p1",
    ]);
    expect(ids_of(await repository.find_available_positions())).toEqual(["p2"]);
    expect(ids_of(page)).toEqual(["p2", "p1"]);
  });

  it("reports player position failures", async () => {
    fail_fake_table("player_positions");
    const repository = new InBrowserPlayerPositionRepository();

    expect(await repository.find_by_code("GK")).toEqual({
      success: false,
      error: "Failed to find position by code",
    });
    expect(await repository.find_by_sport_type("hockey")).toEqual({
      success: false,
      error: "Failed to find positions by sport type",
    });
    expect(await repository.find_by_category("defender")).toEqual({
      success: false,
      error: "Failed to find positions by category",
    });
    expect(await repository.find_available_positions()).toEqual({
      success: false,
      error: "Failed to find available positions",
    });
    expect(await repository.find_by_filter({})).toEqual({
      success: false,
      error: "Failed to filter player positions",
    });
  });
});
