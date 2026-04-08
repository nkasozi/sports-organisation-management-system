import { beforeEach, describe, expect, it, vi } from "vitest";

import type { BaseEntity } from "$lib/core/entities/BaseEntity";

const {
  fetch_entities_for_type_mock,
  get_competition_team_use_cases_mock,
  get_use_cases_for_entity_type_mock,
} = vi.hoisted(() => ({
  fetch_entities_for_type_mock: vi.fn(),
  get_competition_team_use_cases_mock: vi.fn(),
  get_use_cases_for_entity_type_mock: vi.fn(),
}));

vi.mock("$lib/infrastructure/registry/useCaseFactories", () => ({
  get_competition_team_use_cases: get_competition_team_use_cases_mock,
}));

vi.mock("../../infrastructure/registry/entityUseCasesRegistry", () => ({
  get_use_cases_for_entity_type: get_use_cases_for_entity_type_mock,
}));

vi.mock("./dynamicFormDataLoader", () => ({
  fetch_entities_for_type: fetch_entities_for_type_mock,
}));

import {
  compute_teams_after_exclusion,
  fetch_stages_from_competition,
  fetch_teams_excluding_player_memberships,
  fetch_teams_from_competition,
  fetch_teams_from_player_memberships,
  fetch_venue_name_for_team,
} from "./competitionTeamDataFetcher";

function create_entity<TExtra extends Record<string, unknown>>(
  id: string,
  extra: TExtra,
): BaseEntity & TExtra {
  return {
    id,
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z",
    ...extra,
  };
}

describe("competitionTeamDataFetcher", () => {
  beforeEach(() => {
    fetch_entities_for_type_mock.mockReset();
    get_competition_team_use_cases_mock.mockReset();
    get_use_cases_for_entity_type_mock.mockReset();
  });

  it("loads and filters competition teams while honoring an exclusion field", async () => {
    const lions = create_entity("team-1", { name: "Lions" });
    const tigers = create_entity("team-2", { name: "Tigers" });
    const bulls = create_entity("team-3", { name: "Bulls" });

    get_competition_team_use_cases_mock.mockReturnValue({
      list_teams_in_competition: vi.fn().mockResolvedValue({
        success: true,
        data: { items: [{ team_id: "team-1" }, { team_id: "team-2" }] },
      }),
    });
    fetch_entities_for_type_mock.mockResolvedValue([lions, tigers, bulls]);

    await expect(
      fetch_teams_from_competition(
        "competition-1",
        { away_team_id: "team-2" },
        "away_team_id",
      ),
    ).resolves.toEqual({
      teams: [lions],
      all_competition_teams: [lions, tigers],
      competition_team_ids: new Set(["team-1", "team-2"]),
    });
  });

  it("delegates stage loading to the shared entity fetcher with the competition filter", async () => {
    const stage = create_entity("stage-1", {});

    fetch_entities_for_type_mock.mockResolvedValue([stage]);

    await expect(
      fetch_stages_from_competition("competition-1"),
    ).resolves.toEqual([stage]);
    expect(fetch_entities_for_type_mock).toHaveBeenCalledWith(
      "competitionstage",
      { competition_id: "competition-1" },
      100,
    );
  });

  it("returns membership teams and auto-selects the first team when no current value exists", async () => {
    const lions = create_entity("team-1", { name: "Lions" });
    const tigers = create_entity("team-2", { name: "Tigers" });

    fetch_entities_for_type_mock
      .mockResolvedValueOnce([{ team_id: "team-1" }])
      .mockResolvedValueOnce([lions, tigers]);

    await expect(
      fetch_teams_from_player_memberships("player-1", ""),
    ).resolves.toEqual({
      teams: [lions],
      auto_select_team_id: "team-1",
    });
  });

  it("filters out current memberships and mismatched genders when loading available teams", async () => {
    const player = create_entity("player-1", { gender_id: "gender-1" });
    const teams = [
      create_entity("team-1", {
        organization_id: "organization-1",
        gender_id: "gender-1",
      }),
      create_entity("team-2", {
        organization_id: "organization-1",
        gender_id: "gender-1",
      }),
      create_entity("team-3", {
        organization_id: "organization-2",
        gender_id: "gender-1",
      }),
      create_entity("team-4", {
        organization_id: "organization-1",
        gender_id: "gender-2",
      }),
    ];

    fetch_entities_for_type_mock
      .mockResolvedValueOnce([{ team_id: "team-1" }])
      .mockResolvedValueOnce(teams);

    await expect(
      fetch_teams_excluding_player_memberships(
        "player-1",
        [player],
        "organization-1",
      ),
    ).resolves.toEqual([teams[1]]);
  });

  it("computes exclusions locally and resolves the selected team venue name when available", async () => {
    const team_one = create_entity("team-1", {});
    const team_two = create_entity("team-2", {});
    const venue_team = create_entity("team-1", { home_venue_id: "venue-1" });

    get_use_cases_for_entity_type_mock.mockReturnValue({
      success: true,
      data: {
        get_by_id: vi
          .fn()
          .mockResolvedValue({
            success: true,
            data: { name: "National Stadium" },
          }),
      },
    });

    expect(
      compute_teams_after_exclusion([team_one, team_two], "team-2"),
    ).toEqual([team_one]);
    await expect(
      fetch_venue_name_for_team("team-1", [venue_team]),
    ).resolves.toBe("National Stadium");
  });
});
