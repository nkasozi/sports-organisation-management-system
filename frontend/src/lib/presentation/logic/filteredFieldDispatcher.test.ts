import { beforeEach, describe, expect, it, vi } from "vitest";

const filtered_field_dispatcher_mocks = vi.hoisted(() => ({
  fetch_entities_filtered_by_organization: vi.fn(),
  fetch_filtered_jersey_options: vi.fn(),
  fetch_fixtures_for_rating: vi.fn(),
  fetch_fixtures_from_official: vi.fn(),
  fetch_fixtures_without_setup: vi.fn(),
  fetch_officials_from_fixture: vi.fn(),
  fetch_officials_from_organization: vi.fn(),
  fetch_stages_from_competition: vi.fn(),
  fetch_teams_excluding_player_memberships: vi.fn(),
  fetch_teams_from_competition: vi.fn(),
  fetch_teams_from_player_memberships: vi.fn(),
}));

vi.mock("./competitionTeamDataFetcher", () => ({
  fetch_stages_from_competition:
    filtered_field_dispatcher_mocks.fetch_stages_from_competition,
  fetch_teams_excluding_player_memberships:
    filtered_field_dispatcher_mocks.fetch_teams_excluding_player_memberships,
  fetch_teams_from_competition:
    filtered_field_dispatcher_mocks.fetch_teams_from_competition,
  fetch_teams_from_player_memberships:
    filtered_field_dispatcher_mocks.fetch_teams_from_player_memberships,
}));

vi.mock("./dynamicFormDataLoader", () => ({
  fetch_entities_filtered_by_organization:
    filtered_field_dispatcher_mocks.fetch_entities_filtered_by_organization,
}));

vi.mock("./fixtureJerseyDataFetcher", () => ({
  fetch_filtered_jersey_options:
    filtered_field_dispatcher_mocks.fetch_filtered_jersey_options,
  fetch_fixtures_for_rating:
    filtered_field_dispatcher_mocks.fetch_fixtures_for_rating,
  fetch_fixtures_without_setup:
    filtered_field_dispatcher_mocks.fetch_fixtures_without_setup,
}));

vi.mock("./officialDataFetcher", () => ({
  fetch_fixtures_from_official:
    filtered_field_dispatcher_mocks.fetch_fixtures_from_official,
  fetch_officials_from_fixture:
    filtered_field_dispatcher_mocks.fetch_officials_from_fixture,
  fetch_officials_from_organization:
    filtered_field_dispatcher_mocks.fetch_officials_from_organization,
}));

import { fetch_filtered_entities_for_field } from "./filteredFieldDispatcher";

describe("filteredFieldDispatcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns team collections and metadata for competition-scoped team filters", async () => {
    filtered_field_dispatcher_mocks.fetch_teams_from_competition.mockResolvedValue(
      {
        teams: [{ id: "team-1" }],
        all_competition_teams: [{ id: "team-1" }, { id: "team-2" }],
        competition_team_ids: new Set(["team-1", "team-2"]),
      },
    );

    expect(
      await fetch_filtered_entities_for_field(
        {
          field_name: "team_id",
          foreign_key_filter: {
            filter_type: "teams_from_competition",
            exclude_field: "player_id",
          },
        } as never,
        "competition-1",
        [],
        { player_id: "player-1" },
      ),
    ).toEqual({
      entities: [{ id: "team-1" }],
      all_competition_teams: [{ id: "team-1" }, { id: "team-2" }],
      competition_team_ids: new Set(["team-1", "team-2"]),
    });
  });

  it("maps organization-scoped filter types before loading matching entities", async () => {
    filtered_field_dispatcher_mocks.fetch_entities_filtered_by_organization.mockResolvedValue(
      [{ id: "competition-1" }],
    );

    expect(
      await fetch_filtered_entities_for_field(
        {
          field_name: "competition_id",
          foreign_key_entity: "competition",
          foreign_key_filter: { filter_type: "competitions_from_organization" },
        } as never,
        "organization-1",
        [],
        {},
      ),
    ).toEqual({ entities: [{ id: "competition-1" }] });
    expect(
      filtered_field_dispatcher_mocks.fetch_entities_filtered_by_organization,
    ).toHaveBeenCalledWith("competition", "organization-1");
  });

  it("falls back to filtered jersey options when no specialized filter type matches", async () => {
    filtered_field_dispatcher_mocks.fetch_filtered_jersey_options.mockResolvedValue(
      { jerseys: [{ id: "jersey-1" }] },
    );

    expect(
      await fetch_filtered_entities_for_field(
        { field_name: "jersey_color_id" } as never,
        "team-1",
        [],
        {},
      ),
    ).toEqual({ entities: [{ id: "jersey-1" }] });
  });
});
