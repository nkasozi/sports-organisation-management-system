import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetch_filtered_entities_for_field } from "./filteredFieldDispatcher";

const mocks = vi.hoisted(() => ({
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
  fetch_stages_from_competition: mocks.fetch_stages_from_competition,
  fetch_teams_excluding_player_memberships:
    mocks.fetch_teams_excluding_player_memberships,
  fetch_teams_from_competition: mocks.fetch_teams_from_competition,
  fetch_teams_from_player_memberships:
    mocks.fetch_teams_from_player_memberships,
}));

vi.mock("./dynamicFormDataLoader", () => ({
  fetch_entities_filtered_by_organization:
    mocks.fetch_entities_filtered_by_organization,
}));

vi.mock("./fixtureJerseyDataFetcher", () => ({
  fetch_filtered_jersey_options: mocks.fetch_filtered_jersey_options,
  fetch_fixtures_for_rating: mocks.fetch_fixtures_for_rating,
  fetch_fixtures_without_setup: mocks.fetch_fixtures_without_setup,
}));

vi.mock("./officialDataFetcher", () => ({
  fetch_fixtures_from_official: mocks.fetch_fixtures_from_official,
  fetch_officials_from_fixture: mocks.fetch_officials_from_fixture,
  fetch_officials_from_organization: mocks.fetch_officials_from_organization,
}));

const ENTITIES = [{ id: "entity-1" }];
const CACHED_PLAYERS = [{ id: "player-1" }] as never[];

function run(filter_type: string, form_data: Record<string, unknown>): unknown {
  return fetch_filtered_entities_for_field(
    {
      field_name: "target_id",
      foreign_key_entity: "venue",
      foreign_key_filter: { filter_type },
    } as never,
    "dependency-1",
    CACHED_PLAYERS,
    form_data,
  );
}

describe("filteredFieldDispatcher branch characterization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const mock of Object.values(mocks)) mock.mockResolvedValue(ENTITIES);
  });

  it.each([
    [
      "stages_from_competition",
      "fetch_stages_from_competition",
      ["dependency-1"],
    ],
    [
      "teams_excluding_player_memberships",
      "fetch_teams_excluding_player_memberships",
      ["dependency-1", CACHED_PLAYERS, "org-1"],
    ],
    [
      "officials_from_organization",
      "fetch_officials_from_organization",
      ["dependency-1"],
    ],
    [
      "fixtures_without_setup",
      "fetch_fixtures_without_setup",
      ["dependency-1"],
    ],
    ["fixtures_for_rating", "fetch_fixtures_for_rating", ["dependency-1"]],
    [
      "officials_from_fixture",
      "fetch_officials_from_fixture",
      ["dependency-1", "org-1"],
    ],
    [
      "fixtures_from_official",
      "fetch_fixtures_from_official",
      ["dependency-1", "org-1"],
    ],
  ])("dispatches %s", async (filter_type, mock_name, expected_args) => {
    expect(await run(filter_type, { organization_id: "org-1" })).toEqual({
      entities: ENTITIES,
    });
    expect(mocks[mock_name as keyof typeof mocks]).toHaveBeenCalledWith(
      ...expected_args,
    );
  });

  it("passes an empty organization id when it is not a string", async () => {
    await run("officials_from_fixture", { organization_id: 5 });
    expect(mocks.fetch_officials_from_fixture).toHaveBeenCalledWith(
      "dependency-1",
      "",
    );
  });

  it("returns auto-selected team ids for player membership filters", async () => {
    mocks.fetch_teams_from_player_memberships.mockResolvedValue({
      teams: ENTITIES,
      auto_select_team_id: "team-9",
    });
    expect(
      await run("teams_from_player_memberships", { target_id: "team-1" }),
    ).toEqual({ entities: ENTITIES, auto_select_team_id: "team-9" });
    expect(mocks.fetch_teams_from_player_memberships).toHaveBeenCalledWith(
      "dependency-1",
      "team-1",
    );
    await run("teams_from_player_memberships", { target_id: 3 });
    expect(mocks.fetch_teams_from_player_memberships).toHaveBeenLastCalledWith(
      "dependency-1",
      "",
    );
  });

  it("uses the foreign key entity for lookup_from_organization", async () => {
    expect(await run("lookup_from_organization", {})).toEqual({
      entities: ENTITIES,
    });
    expect(mocks.fetch_entities_filtered_by_organization).toHaveBeenCalledWith(
      "venue",
      "dependency-1",
    );
  });

  it("falls back to jersey options for unknown or inherited keys", async () => {
    mocks.fetch_filtered_jersey_options.mockResolvedValue({
      jerseys: ENTITIES,
    });
    expect(await run("toString", {})).toEqual({ entities: ENTITIES });
    expect(
      mocks.fetch_entities_filtered_by_organization,
    ).not.toHaveBeenCalled();
  });
});
