import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  load_dynamic_form_fixture_gender_warnings,
  load_dynamic_form_player_gender_warnings,
} from "./dynamicEntityFormGenderWarnings";

const { fixture_mismatch_mock, player_mismatch_mock } = vi.hoisted(() => ({
  fixture_mismatch_mock: vi.fn(() => ["fixture warning"]),
  player_mismatch_mock: vi.fn(() => ["player warning"]),
}));

vi.mock("../../core/services/genderMismatchCheck", () => ({
  check_fixture_team_gender_mismatch: fixture_mismatch_mock,
  check_player_team_gender_mismatch: player_mismatch_mock,
}));

function loader(records: Record<string, unknown>): {
  get_by_id: ReturnType<typeof vi.fn>;
} {
  return {
    get_by_id: vi.fn(async (id: string) =>
      id in records ? { success: true, data: records[id] } : { success: false },
    ),
  };
}

const genders = loader({ g1: { name: "Men" }, g2: {} });

describe("dynamicEntityFormGenderWarnings edge cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses to_team_id for transfer history and skips unnamed genders", async () => {
    const teams = loader({ t2: { gender_id: "g2" } });
    const warnings = await load_dynamic_form_player_gender_warnings(
      "PlayerTeamTransferHistory",
      { player_id: "p1", team_id: "t1", to_team_id: "t2" },
      {
        team_use_cases: teams,
        player_use_cases_result: {
          success: true,
          data: loader({ p1: { gender_id: "g1" } }),
        },
        gender_use_cases_result: { success: true, data: genders },
      } as never,
    );
    expect(warnings).toEqual(["player warning"]);
    expect(teams.get_by_id).toHaveBeenCalledWith("t2");
    expect(player_mismatch_mock).toHaveBeenCalledWith({
      player_gender_id: "g1",
      team_gender_id: "g2",
      player_display_name: "",
      team_display_name: "t2",
      gender_name_map: new Map([["g1", "Men"]]),
    });
  });

  it.each([
    ["failed player load", loader({}), { t1: { gender_id: "g1" } }],
    ["missing player gender", loader({ p1: {} }), { t1: { gender_id: "g1" } }],
    ["missing team gender", loader({ p1: { gender_id: "g1" } }), { t1: {} }],
  ])("returns no player warnings on %s", async (_l, players, teams) => {
    await expect(
      load_dynamic_form_player_gender_warnings(
        "PlayerTeamMembership",
        { player_id: "p1", team_id: "t1" },
        {
          team_use_cases: loader(teams),
          player_use_cases_result: { success: true, data: players },
          gender_use_cases_result: { success: true, data: genders },
        } as never,
      ),
    ).resolves.toEqual([]);
    expect(player_mismatch_mock).not.toHaveBeenCalled();
  });

  it("returns no player warnings when player use cases have no data", async () => {
    await expect(
      load_dynamic_form_player_gender_warnings(
        "PlayerTeamMembership",
        { player_id: "p1", team_id: "t1" },
        {
          team_use_cases: loader({}),
          player_use_cases_result: { success: true },
          gender_use_cases_result: { success: true, data: genders },
        } as never,
      ),
    ).resolves.toEqual([]);
  });

  it.each([
    [
      "missing away id",
      { home_team_id: "t1" },
      { success: true, data: genders },
    ],
    [
      "missing gender use cases",
      { home_team_id: "t1", away_team_id: "t2" },
      { success: true },
    ],
    [
      "failed away load",
      { home_team_id: "t1", away_team_id: "t9" },
      { success: true, data: genders },
    ],
  ])("returns no fixture warnings on %s", async (_l, form, gender_result) => {
    await expect(
      load_dynamic_form_fixture_gender_warnings(form, {
        team_use_cases: loader({ t1: { gender_id: "g1" }, t2: {} }),
        gender_use_cases_result: gender_result,
      } as never),
    ).resolves.toEqual([]);
    expect(fixture_mismatch_mock).not.toHaveBeenCalled();
  });

  it("falls back to team ids for fixture display names", async () => {
    await load_dynamic_form_fixture_gender_warnings(
      { home_team_id: "t1", away_team_id: "t2" },
      {
        team_use_cases: loader({
          t1: { gender_id: "g1" },
          t2: { gender_id: "g1", name: "Away" },
        }),
        gender_use_cases_result: { success: true, data: genders },
      } as never,
    );
    expect(fixture_mismatch_mock).toHaveBeenCalledWith({
      home_team_gender_id: "g1",
      away_team_gender_id: "g1",
      home_team_display_name: "t1",
      away_team_display_name: "Away",
      gender_name_map: new Map([["g1", "Men"]]),
    });
  });
});
