import { beforeEach, describe, expect, it, vi } from "vitest";

const { detect_official_team_conflicts_mock } = vi.hoisted(() => ({
  detect_official_team_conflicts_mock: vi.fn(),
}));

vi.mock("../../core/entities/FixtureDetailsSetup", () => ({
  detect_official_team_conflicts: detect_official_team_conflicts_mock,
}));

import { load_dynamic_form_official_conflict_warnings } from "./dynamicEntityFormOfficialConflictWarnings";

describe("dynamicEntityFormOfficialConflictWarnings", () => {
  beforeEach(() => {
    detect_official_team_conflicts_mock.mockReset();
  });

  it("returns no warnings when the form is not for fixture detail setup or has no assignments", async () => {
    await expect(
      load_dynamic_form_official_conflict_warnings("fixture", {}, {
        fixture_use_cases: { get_by_id: vi.fn() },
        team_use_cases: { get_by_id: vi.fn() },
        official_use_cases: null,
        official_associated_team_use_cases: { list_by_official: vi.fn() },
      } as never),
    ).resolves.toEqual([]);
  });

  it("builds official association details and maps detected conflict messages", async () => {
    detect_official_team_conflicts_mock.mockReturnValueOnce([
      { message: "Official is associated with the home team" },
    ]);

    await expect(
      load_dynamic_form_official_conflict_warnings(
        "FixtureDetailsSetup",
        {
          fixture_id: "fixture-1",
          assigned_officials: [{ official_id: "official-1" }],
        },
        {
          fixture_use_cases: {
            get_by_id: vi.fn().mockResolvedValueOnce({
              success: true,
              data: { home_team_id: "team-1", away_team_id: "team-2" },
            }),
          },
          team_use_cases: {
            get_by_id: vi
              .fn()
              .mockResolvedValueOnce({ success: true, data: { name: "Lions" } })
              .mockResolvedValueOnce({
                success: true,
                data: { name: "Falcons" },
              }),
          },
          official_use_cases: {
            get_by_id: vi.fn().mockResolvedValueOnce({
              success: true,
              data: { first_name: "Alex", last_name: "Ref" },
            }),
          },
          official_associated_team_use_cases: {
            list_by_official: vi.fn().mockResolvedValueOnce({
              success: true,
              data: [
                {
                  team_id: "team-1",
                  association_type: "coach",
                  status: "active",
                },
              ],
            }),
          },
        } as never,
      ),
    ).resolves.toEqual(["Official is associated with the home team"]);
  });
});
