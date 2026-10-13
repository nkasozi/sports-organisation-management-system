import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetch_teams_from_competition } from "./competitionTeamDataFetcher";

const { fetch_entities_for_type_mock, list_teams_in_competition_mock } =
  vi.hoisted(() => ({
    fetch_entities_for_type_mock: vi.fn(),
    list_teams_in_competition_mock: vi.fn(),
  }));

vi.mock("$lib/infrastructure/registry/useCaseFactories", () => ({
  get_competition_team_use_cases: () => ({
    list_teams_in_competition: list_teams_in_competition_mock,
  }),
}));

vi.mock("../../infrastructure/registry/entityUseCasesRegistry", () => ({
  get_use_cases_for_entity_type: vi.fn(),
}));

vi.mock("./dynamicFormDataLoader", () => ({
  fetch_entities_for_type: fetch_entities_for_type_mock,
}));

describe("fetch_teams_from_competition failures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "debug").mockImplementation(() => {});
  });

  it("returns an empty result when competition teams cannot be listed", async () => {
    list_teams_in_competition_mock.mockResolvedValue({ success: false });
    await expect(
      fetch_teams_from_competition("competition-1", {}),
    ).resolves.toEqual({
      teams: [],
      all_competition_teams: [],
      competition_team_ids: new Set(),
    });
    expect(list_teams_in_competition_mock).toHaveBeenCalledWith(
      "competition-1",
      { page_size: 100 },
    );
    expect(fetch_entities_for_type_mock).not.toHaveBeenCalled();
  });

  it("keeps competition team ids when no teams are available", async () => {
    list_teams_in_competition_mock.mockResolvedValue({
      success: true,
      data: { items: [{ team_id: "team-1" }] },
    });
    fetch_entities_for_type_mock.mockResolvedValue([]);
    await expect(
      fetch_teams_from_competition("competition-1", {}),
    ).resolves.toEqual({
      teams: [],
      all_competition_teams: [],
      competition_team_ids: new Set(["team-1"]),
    });
  });

  it("ignores non-string exclusion values", async () => {
    const team = { id: "team-1" };
    list_teams_in_competition_mock.mockResolvedValue({
      success: true,
      data: { items: [{ team_id: "team-1" }] },
    });
    fetch_entities_for_type_mock.mockResolvedValue([team]);
    await expect(
      fetch_teams_from_competition("competition-1", { home: 5 }, "home"),
    ).resolves.toEqual({
      teams: [team],
      all_competition_teams: [team],
      competition_team_ids: new Set(["team-1"]),
    });
  });
});
