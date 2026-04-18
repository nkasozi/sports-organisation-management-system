import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  load_dynamic_form_fixture_gender_warnings,
  load_dynamic_form_player_gender_warnings,
} from "./dynamicEntityFormGenderWarnings";

const {
  check_fixture_team_gender_mismatch_mock,
  check_player_team_gender_mismatch_mock,
} = vi.hoisted(() => ({
  check_fixture_team_gender_mismatch_mock: vi.fn(),
  check_player_team_gender_mismatch_mock: vi.fn(),
}));

vi.mock("../../core/services/genderMismatchCheck", () => ({
  check_fixture_team_gender_mismatch: check_fixture_team_gender_mismatch_mock,
  check_player_team_gender_mismatch: check_player_team_gender_mismatch_mock,
}));

describe("dynamicEntityFormGenderWarnings", () => {
  beforeEach(() => {
    check_fixture_team_gender_mismatch_mock.mockReset();
    check_player_team_gender_mismatch_mock.mockReset();
  });

  it("returns no player gender warnings when required identifiers or dependencies are missing", async () => {
    await expect(
      load_dynamic_form_player_gender_warnings("PlayerTeamMembership", {}, {
        team_use_cases: { get_by_id: vi.fn() },
        player_use_cases_result: {
          success: true,
          data: { get_by_id: vi.fn() },
        },
        gender_use_cases_result: { success: false },
      } as never),
    ).resolves.toEqual([]);
  });

  it("loads player and team genders to build player gender mismatch warnings", async () => {
    check_player_team_gender_mismatch_mock.mockReturnValueOnce([
      "Player and team genders do not match",
    ]);

    await expect(
      load_dynamic_form_player_gender_warnings(
        "PlayerTeamTransferHistory",
        { player_id: "player-1", to_team_id: "team-1" },
        {
          team_use_cases: {
            get_by_id: vi.fn().mockResolvedValueOnce({
              success: true,
              data: { gender_id: "gender-2", name: "Lions" },
            }),
          },
          player_use_cases_result: {
            success: true,
            data: {
              get_by_id: vi.fn().mockResolvedValueOnce({
                success: true,
                data: {
                  gender_id: "gender-1",
                  first_name: "Alex",
                  last_name: "Smith",
                },
              }),
            },
          },
          gender_use_cases_result: {
            success: true,
            data: {
              get_by_id: vi
                .fn()
                .mockResolvedValueOnce({
                  success: true,
                  data: { name: "Women" },
                })
                .mockResolvedValueOnce({
                  success: true,
                  data: { name: "Men" },
                }),
            },
          },
        } as never,
      ),
    ).resolves.toEqual(["Player and team genders do not match"]);
  });

  it("loads home and away team genders to build fixture gender warnings", async () => {
    check_fixture_team_gender_mismatch_mock.mockReturnValueOnce([
      "Home and away team genders do not match",
    ]);

    await expect(
      load_dynamic_form_fixture_gender_warnings(
        { home_team_id: "team-1", away_team_id: "team-2" },
        {
          team_use_cases: {
            get_by_id: vi
              .fn()
              .mockResolvedValueOnce({
                success: true,
                data: { gender_id: "gender-1", name: "Lions" },
              })
              .mockResolvedValueOnce({
                success: true,
                data: { gender_id: "gender-2", name: "Falcons" },
              }),
          },
          gender_use_cases_result: {
            success: true,
            data: {
              get_by_id: vi
                .fn()
                .mockResolvedValueOnce({
                  success: true,
                  data: { name: "Women" },
                })
                .mockResolvedValueOnce({
                  success: true,
                  data: { name: "Men" },
                }),
            },
          },
        } as never,
      ),
    ).resolves.toEqual(["Home and away team genders do not match"]);
  });
});
