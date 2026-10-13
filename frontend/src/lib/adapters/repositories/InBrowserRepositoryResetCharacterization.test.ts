import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { reset_competition_format_repository } from "./InBrowserCompetitionFormatRepository";
import { reset_fixture_lineup_repository } from "./InBrowserFixtureLineupRepository";
import { reset_game_event_type_repository } from "./InBrowserGameEventTypeRepository";
import { reset_game_official_role_repository } from "./InBrowserGameOfficialRoleRepository";
import { reset_jersey_color_repository } from "./InBrowserJerseyColorRepository";
import { reset_official_repository } from "./InBrowserOfficialRepository";
import { reset_player_position_repository } from "./InBrowserPlayerPositionRepository";
import { reset_player_profile_repository } from "./InBrowserPlayerProfileRepository";
import { reset_player_repository } from "./InBrowserPlayerRepository";
import {
  fail_fake_table,
  get_fake_table,
  reset_fake_database,
  seed_fake_table,
} from "./InBrowserRepositoryFakeDatabase.test_support";
import { row } from "./InBrowserRepositoryFilterCases.test_support";
import {
  type RepositoryWriteOrigin,
  USER_WRITE_ORIGIN,
} from "./InBrowserRepositoryWriteOrigin";
import {
  create_sport,
  delete_sport,
  get_active_sports,
  get_all_sports,
  get_sport_by_code,
  get_sport_by_id,
  is_sport_not_found_by_code_error,
  reset_sport_repository,
  update_sport,
} from "./InBrowserSportRepository";
import { reset_team_profile_repository } from "./InBrowserTeamProfileRepository";
import { reset_venue_repository } from "./InBrowserVenueRepository";

vi.mock("./database", async () => {
  const support =
    await import("./InBrowserRepositoryFakeDatabase.test_support");
  return { get_database: () => support.fake_database };
});

const RESET_CASES: Array<
  [string, string, (origin: RepositoryWriteOrigin) => Promise<unknown>, number]
> = [
  ["venues", "venues", reset_venue_repository, 3],
  ["jersey colors", "jersey_colors", reset_jersey_color_repository, 6],
  ["officials", "officials", reset_official_repository, 3],
  ["player profiles", "player_profiles", reset_player_profile_repository, 2],
  ["team profiles", "team_profiles", reset_team_profile_repository, 2],
  ["fixture lineups", "fixture_lineups", reset_fixture_lineup_repository, 0],
  ["formats", "competition_formats", reset_competition_format_repository, 0],
  ["event types", "game_event_types", reset_game_event_type_repository, 0],
  ["roles", "game_official_roles", reset_game_official_role_repository, 0],
  ["positions", "player_positions", reset_player_position_repository, 0],
  ["players", "players", reset_player_repository, 0],
];

describe("InBrowser repository resets and sport service", () => {
  let log_spy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    reset_fake_database();
    log_spy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    log_spy.mockRestore();
  });

  it.each(RESET_CASES)(
    "resets %s to default rows",
    async (_name, table, reset, expected_count) => {
      seed_fake_table(table, [row("stale", {})]);

      await reset(USER_WRITE_ORIGIN);

      const rows = get_fake_table(table).rows;
      expect(rows).toHaveLength(expected_count);
      expect(rows.some((item) => item.id === "stale")).toBe(false);
    },
  );

  it("resets fixture lineups with a true result", async () => {
    expect(await reset_fixture_lineup_repository(USER_WRITE_ORIGIN)).toEqual({
      success: true,
      data: 0,
    });
  });

  it("seeds default sports and reads them by id, code and status", async () => {
    const all_sports_result = await get_all_sports();
    const all_sports = all_sports_result.success ? all_sports_result.data : [];
    const by_code = await get_sport_by_code(all_sports[0].code.toUpperCase());
    const missing_code = await get_sport_by_code("NOPE");
    const missing_id = await get_sport_by_id("missing");

    expect(all_sports).toHaveLength(3);
    expect(by_code.success && by_code.data.id).toBe(all_sports[0].id);
    expect(
      !missing_code.success &&
        is_sport_not_found_by_code_error(missing_code.error, "NOPE"),
    ).toBe(true);
    expect(missing_id).toEqual({
      success: false,
      error: "Sport not found: id=missing",
    });
    const active_sports = await get_active_sports();
    expect(active_sports.success && active_sports.data.length).toBeGreaterThan(
      0,
    );
  });

  it("creates, updates, deletes and resets sports", async () => {
    const created = await create_sport({
      name: "Rugby",
      status: "active",
    } as never);
    const sport_id = created.success ? created.data.id : "";
    const updated = await update_sport(sport_id, { name: "Rugby 7s" } as never);
    const deleted = await delete_sport(sport_id);
    const reset = await reset_sport_repository(USER_WRITE_ORIGIN);

    expect(updated.success && updated.data.name).toBe("Rugby 7s");
    expect(deleted).toEqual({ success: true, data: true });
    expect((await delete_sport("missing")).success).toBe(false);
    expect(reset.success && reset.data.map((sport) => sport.id)).toEqual(
      get_fake_table("sports").rows.map((item) => item.id),
    );
    expect(log_spy).toHaveBeenCalledWith(
      "[SportRepository] Reset complete",
      expect.objectContaining({
        event: "sport_repository_reset",
        sport_count: 3,
      }),
    );
  });

  it("reports clear and seed-check failures instead of silently continuing", async () => {
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const warn_spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    fail_fake_table("venues");
    fail_fake_table("sports");

    expect(await reset_venue_repository(USER_WRITE_ORIGIN)).toEqual({
      success: false,
      error: "Failed to clear entities",
    });
    expect(await get_all_sports()).toEqual({
      success: false,
      error: "Failed to check for existing data",
    });
    expect(error_spy).toHaveBeenCalledWith(
      "[Repository] Failed to clear data",
      expect.objectContaining({
        event: "repository_clear_failed",
        error_code: "repository_storage_operation_failed",
        table: "venues",
      }),
    );
    error_spy.mockRestore();
    warn_spy.mockRestore();
  });
});
