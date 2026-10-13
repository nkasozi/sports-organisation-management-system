import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PlayerTeamMembershipRepository } from "../../core/interfaces/ports";
import { get_activity_repository } from "./InBrowserActivityRepository";
import { get_calendar_token_repository } from "./InBrowserCalendarTokenRepository";
import { InBrowserPlayerRepository } from "./InBrowserPlayerRepository";
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

function create_membership_repository(
  result: unknown,
): PlayerTeamMembershipRepository {
  return {
    find_by_team: vi.fn().mockResolvedValue(result),
  } as unknown as PlayerTeamMembershipRepository;
}

const MEMBERSHIPS = {
  success: true,
  data: {
    items: [
      { player_id: "p1", jersey_number: 7 },
      { player_id: "p2", jersey_number: 9 },
    ],
  },
};

describe("InBrowser player repository", () => {
  let warn_spy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    reset_fake_database();
    warn_spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    seed_fake_table("players", [
      row("p1", { first_name: "Ann", last_name: "A", status: "active" }),
      row("p2", { first_name: "Bob", last_name: "B", status: "inactive" }),
      row("p3", { first_name: "Cid", last_name: "C", status: "active" }),
    ]);
  });

  afterEach(() => {
    warn_spy.mockRestore();
  });

  it("restricts players to team memberships and other filters", async () => {
    const repository = new InBrowserPlayerRepository(
      create_membership_repository(MEMBERSHIPS),
    );

    expect(ids_of(await repository.find_by_team("t1" as never))).toEqual([
      "p1",
      "p2",
    ]);
    expect(ids_of(await repository.find_active_players())).toEqual([
      "p1",
      "p3",
    ]);
    expect(ids_of(await repository.find_all({}))).toEqual(["p1", "p2", "p3"]);
    expect(
      ids_of(await repository.find_all({ team_id: "t1", status: "active" })),
    ).toEqual(["p1"]);
  });

  it("propagates membership failures instead of returning no players", async () => {
    const membership_failure = { success: false, error: "x" };
    const repository = new InBrowserPlayerRepository(
      create_membership_repository(membership_failure),
    );

    expect(await repository.find_by_team("t1" as never)).toEqual(
      membership_failure,
    );
    expect(await repository.find_by_jersey_number("t1" as never, 7)).toEqual(
      membership_failure,
    );
  });

  it("finds players by jersey number", async () => {
    const repository = new InBrowserPlayerRepository(
      create_membership_repository(MEMBERSHIPS),
    );

    const result = await repository.find_by_jersey_number("t1" as never, 9);

    expect(ids_of(result)).toEqual(["p2"]);
    expect(result.success && result.data.total_count).toBe(1);
  });

  it("reports player storage failures", async () => {
    fail_fake_table("players");
    const repository = new InBrowserPlayerRepository(
      create_membership_repository(MEMBERSHIPS),
    );

    expect(await repository.find_by_filter({ status: "active" })).toEqual({
      success: false,
      error: "Failed to filter players",
    });
    expect(await repository.find_by_jersey_number("t1" as never, 9)).toEqual({
      success: false,
      error: "Failed to find players by jersey number",
    });
    expect(warn_spy).toHaveBeenCalledWith(
      "[PlayerRepository] Failed to filter players",
      expect.objectContaining({
        event: "repository_filter_players_failed",
        error_code: "repository_storage_operation_failed",
        error: `Error: ${FAKE_TABLE_FAILURE_MESSAGE}`,
      }),
    );
  });

  it("reuses repository singletons", () => {
    expect(get_activity_repository()).toBe(get_activity_repository());
    expect(get_calendar_token_repository()).toBe(
      get_calendar_token_repository(),
    );
  });
});
