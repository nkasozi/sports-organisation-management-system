import { describe, expect, it, vi } from "vitest";

import {
  auto_generate_live_game_lineup,
  ensure_live_game_lineups_before_start,
} from "./liveGameDetailLineupActions";

type EnsureParameters = Parameters<
  typeof ensure_live_game_lineups_before_start
>;
type EnsureFixture = EnsureParameters[0];
type EnsurePlayers = EnsureParameters[1];
type EnsureTeam = NonNullable<EnsureParameters[3]>;
type PlayerMembershipUseCases = EnsureParameters[6];
type PlayerUseCases = EnsureParameters[7];
type FixtureLineupUseCases = EnsureParameters[8];

const FIXTURE = {
  id: "fixture-1",
  organization_id: "organization-1",
  home_team_id: "team-home",
  away_team_id: "team-away",
} as EnsureFixture;
const ONE_PLAYER = [{ id: "player-x" }] as unknown as EnsurePlayers;
const NO_PLAYERS = [] as unknown as EnsurePlayers;

function run_ensure(
  home_players: EnsurePlayers,
  away_players: EnsurePlayers,
  allow_auto_submission: boolean,
  membership_items: Array<{ player_id: string; status: string }>,
  teams: { home: EnsureTeam | undefined; away: EnsureTeam | undefined },
): ReturnType<typeof ensure_live_game_lineups_before_start> {
  return ensure_live_game_lineups_before_start(
    FIXTURE,
    home_players,
    away_players,
    teams.home,
    teams.away,
    allow_auto_submission,
    {
      list: vi.fn().mockResolvedValue({
        success: true,
        data: { items: membership_items },
      }),
    } as unknown as PlayerMembershipUseCases,
    {
      get_by_id: vi.fn().mockResolvedValue({ success: false }),
    } as unknown as PlayerUseCases,
    {
      create: vi.fn().mockResolvedValue({ success: true }),
    } as unknown as FixtureLineupUseCases,
  );
}

const NAMED_TEAMS = {
  home: { name: "Lions" } as EnsureTeam,
  away: { name: "Tigers" } as EnsureTeam,
};
const UNNAMED_TEAMS = { home: undefined, away: undefined };

describe("liveGameDetailLineupActions start guards", () => {
  it("returns no reload when both lineups exist", async () => {
    await expect(
      run_ensure(ONE_PLAYER, ONE_PLAYER, false, [], NAMED_TEAMS),
    ).resolves.toEqual({ success: true, reloaded_required: false });
  });

  it("describes only the home team when only the home lineup is missing", async () => {
    await expect(
      run_ensure(NO_PLAYERS, ONE_PLAYER, false, [], UNNAMED_TEAMS),
    ).resolves.toEqual({
      success: false,
      error_message:
        "Home Team has not submitted their squad for this fixture. Please submit lineups before starting the game.",
    });
  });

  it("describes only the away team when only the away lineup is missing", async () => {
    await expect(
      run_ensure(ONE_PLAYER, NO_PLAYERS, false, [], NAMED_TEAMS),
    ).resolves.toEqual({
      success: false,
      error_message:
        "Tigers has not submitted their squad for this fixture. Please submit lineups before starting the game.",
    });
  });

  it("fails when the home lineup cannot be auto-generated", async () => {
    await expect(
      run_ensure(NO_PLAYERS, NO_PLAYERS, true, [], NAMED_TEAMS),
    ).resolves.toEqual({
      success: false,
      error_message: "Failed to auto-generate lineup for Lions",
    });
  });

  it("fails when the away lineup cannot be auto-generated", async () => {
    await expect(
      run_ensure(ONE_PLAYER, NO_PLAYERS, true, [], UNNAMED_TEAMS),
    ).resolves.toEqual({
      success: false,
      error_message: "Failed to auto-generate lineup for Away Team",
    });
  });

  it("returns false without creating a lineup when memberships cannot be listed", async () => {
    const create = vi.fn().mockResolvedValue({ success: false });
    const result = await auto_generate_live_game_lineup(
      FIXTURE,
      "team-home",
      {
        list: vi.fn().mockResolvedValue({ success: false }),
      } as unknown as PlayerMembershipUseCases,
      {} as PlayerUseCases,
      { create } as unknown as FixtureLineupUseCases,
    );
    expect(result).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });
});
