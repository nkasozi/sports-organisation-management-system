import { describe, expect, it, vi } from "vitest";

import { load_fixture_lineup_create_team_data } from "./fixtureLineupCreateDataTeam";
import type { FixtureLineupCreateDependencies } from "./fixtureLineupCreateDataTypes";

describe("fixtureLineupCreateDataTeam empty roster", () => {
  it("reports missing players and scopes positions to the profile organization", async () => {
    const team = { id: "team-home", name: "Home" };
    const position_list = vi.fn().mockResolvedValue({ success: false });
    const dependencies = {
      team_use_cases: {
        get_by_id: vi.fn().mockResolvedValue({ success: true, data: team }),
      },
      player_use_cases: {
        list_players_by_team: vi.fn().mockResolvedValue({ success: false }),
      },
      membership_use_cases: {
        list_memberships_by_team: vi.fn().mockResolvedValue({ success: false }),
      },
      player_position_use_cases: { list: position_list },
    } as unknown as FixtureLineupCreateDependencies;

    const result = await load_fixture_lineup_create_team_data(
      "team-home",
      {
        status: "present",
        fixture: {
          home_team_id: "team-home",
          away_team_id: "team-away",
        } as never,
      },
      {
        status: "present",
        profile: { organization_id: "organization-1" } as never,
      },
      18,
      dependencies,
    );

    expect(position_list).toHaveBeenCalledWith(
      { organization_id: "organization-1" },
      { page_number: 1, page_size: 500 },
    );
    expect(result).toEqual({
      selected_team_state: { status: "present", team },
      team_players: [],
      selected_players: [],
      validation_error: expect.stringContaining(
        "No players found for this team.",
      ),
    });
  });
});
