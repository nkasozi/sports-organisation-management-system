import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { InBrowserPlayerProfileRepository } from "./InBrowserPlayerProfileRepository";
import {
  fail_fake_table,
  FAKE_TABLE_FAILURE_MESSAGE,
  reset_fake_database,
  seed_fake_table,
} from "./InBrowserRepositoryFakeDatabase.test_support";
import { row } from "./InBrowserRepositoryFilterCases.test_support";
import { InBrowserTeamProfileRepository } from "./InBrowserTeamProfileRepository";

vi.mock("./database", async () => {
  const support =
    await import("./InBrowserRepositoryFakeDatabase.test_support");
  return { get_database: () => support.fake_database };
});

describe("InBrowser profile repository lookups", () => {
  let warn_spy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    reset_fake_database();
    warn_spy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warn_spy.mockRestore();
  });

  it("finds player and team profiles by owner and slug", async () => {
    seed_fake_table("player_profiles", [
      row("pp1", { player_id: "p1", profile_slug: "john" }),
    ]);
    seed_fake_table("team_profiles", [
      row("tp1", { team_id: "t1", profile_slug: "club" }),
    ]);
    const players = new InBrowserPlayerProfileRepository();
    const teams = new InBrowserTeamProfileRepository();

    expect((await players.find_by_player_id("p1" as never)).success).toBe(true);
    expect(await players.find_by_player_id("p9" as never)).toEqual({
      success: false,
      error: "No profile found for player: p9",
    });
    expect(await players.find_by_slug("x")).toEqual({
      success: false,
      error: "No profile found with slug: x",
    });
    expect((await teams.find_by_slug("club")).success).toBe(true);
    expect(await teams.find_by_team_id("t9" as never)).toEqual({
      success: false,
      error: "No profile found for team: t9",
    });
  });

  it("reports profile storage failures with error messages", async () => {
    fail_fake_table("player_profiles");
    fail_fake_table("team_profiles");
    const message = FAKE_TABLE_FAILURE_MESSAGE;

    expect(
      await new InBrowserPlayerProfileRepository().find_by_player_id(
        "p" as never,
      ),
    ).toEqual({
      success: false,
      error: "Failed to find profile by player_id",
    });
    expect(
      await new InBrowserPlayerProfileRepository().find_by_slug("s"),
    ).toEqual({
      success: false,
      error: "Failed to find profile by slug",
    });
    expect(
      await new InBrowserTeamProfileRepository().find_by_team_id("t" as never),
    ).toEqual({
      success: false,
      error: "Failed to find profile by team_id",
    });
    expect(
      await new InBrowserTeamProfileRepository().find_by_slug("s"),
    ).toEqual({
      success: false,
      error: "Failed to find profile by slug",
    });
  });
});
