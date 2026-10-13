import { beforeEach, describe, expect, it, vi } from "vitest";

import { load_dynamic_form_official_conflict_warnings } from "./dynamicEntityFormOfficialConflictWarnings";

const { detect_mock } = vi.hoisted(() => ({
  detect_mock: vi.fn((..._args: unknown[]) => [{ message: "conflict" }]),
}));

vi.mock("../../core/entities/FixtureDetailsSetup", () => ({
  detect_official_team_conflicts: detect_mock,
}));

const ASSIGNMENTS = [{ official_id: "o1" }, { official_id: "" }];

describe("dynamicEntityFormOfficialConflictWarnings edge cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns no warnings when the fixture cannot be loaded", async () => {
    await expect(
      load_dynamic_form_official_conflict_warnings(
        "fixturedetailssetup",
        { fixture_id: "f1", assigned_officials: ASSIGNMENTS },
        {
          fixture_use_cases: {
            get_by_id: vi.fn(async () => ({ success: true })),
          },
          team_use_cases: { get_by_id: vi.fn() },
          official_associated_team_use_cases: { list_by_official: vi.fn() },
        } as never,
      ),
    ).resolves.toEqual([]);
    expect(detect_mock).not.toHaveBeenCalled();
  });

  it("uses default names and paginated active associations", async () => {
    const team_get_by_id = vi
      .fn()
      .mockResolvedValueOnce({ success: false })
      .mockResolvedValueOnce({ success: true, data: {} });
    const result = await load_dynamic_form_official_conflict_warnings(
      "FixtureDetailsSetup",
      { fixture_id: "f1", assigned_officials: ASSIGNMENTS },
      {
        fixture_use_cases: {
          get_by_id: vi.fn(async () => ({ success: true, data: {} })),
        },
        team_use_cases: { get_by_id: team_get_by_id },
        official_use_cases: {
          get_by_id: vi.fn(async () => ({ success: false })),
        },
        official_associated_team_use_cases: {
          list_by_official: vi.fn(async () => ({
            success: true,
            data: {
              items: [
                { team_id: "t1", association_type: "coach", status: "active" },
                { team_id: "t2", association_type: "fan", status: "inactive" },
              ],
            },
          })),
        },
      } as never,
    );

    expect(result).toEqual(["conflict"]);
    expect(team_get_by_id).toHaveBeenCalledWith("");
    expect(detect_mock).toHaveBeenCalledWith(
      ASSIGNMENTS,
      [
        {
          id: "o1",
          first_name: "Unknown",
          last_name: "Official",
          associated_team_ids: ["t1"],
          association_details: [{ team_id: "t1", association_type: "coach" }],
        },
      ],
      "",
      "",
      "Home Team",
      "Away Team",
    );
  });

  it("treats failed association loads as no associations", async () => {
    await load_dynamic_form_official_conflict_warnings(
      "FixtureDetailsSetup",
      { fixture_id: "f1", assigned_officials: [{ official_id: "o1" }] },
      {
        fixture_use_cases: {
          get_by_id: vi.fn(async () => ({
            success: true,
            data: { home_team_id: "h", away_team_id: "a" },
          })),
        },
        team_use_cases: { get_by_id: vi.fn(async () => ({ success: false })) },
        official_use_cases: {
          get_by_id: vi.fn(async () => ({ success: true, data: {} })),
        },
        official_associated_team_use_cases: {
          list_by_official: vi.fn(async () => ({ success: false })),
        },
      } as never,
    );
    expect(detect_mock.mock.calls[0][1]).toEqual([
      {
        id: "o1",
        first_name: "Unknown",
        last_name: "Official",
        associated_team_ids: [],
        association_details: [],
      },
    ]);
  });
});
