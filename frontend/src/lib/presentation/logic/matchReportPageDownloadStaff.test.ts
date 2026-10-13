import { describe, expect, it, vi } from "vitest";

import type { Fixture } from "$lib/core/entities/Fixture";

import {
  load_match_report_team_staff,
  type MatchReportPageDownloadDependencies,
} from "./matchReportPageDownloadStaff";

describe("matchReportPageDownloadStaff", () => {
  it("maps staff roles, falls back to Staff, and empties failed teams", async () => {
    const list_staff_by_team = vi.fn(async (team_id: string) =>
      team_id === "home"
        ? {
            success: true,
            data: {
              items: [
                { role_id: "coach", first_name: "Ann", last_name: "Lee" },
                { role_id: "unknown", first_name: "Bo", last_name: "Kim" },
              ],
            },
          }
        : { success: false, error: "boom" },
    );
    const dependencies = {
      organization_use_cases: { get_by_id: vi.fn() },
      team_staff_use_cases: {
        list_staff_roles: vi.fn(async () => ({
          success: true,
          data: [{ id: "coach", name: "Head Coach" }],
        })),
        list_staff_by_team,
      },
    } as unknown as MatchReportPageDownloadDependencies;

    const result = await load_match_report_team_staff(
      { home_team_id: "home", away_team_id: "away" } as Fixture,
      dependencies,
    );

    expect(result.away_staff).toEqual([]);
    expect(result.home_staff.map((entry) => entry.role)).toEqual([
      "Head Coach",
      "Staff",
    ]);
    expect(list_staff_by_team).toHaveBeenCalledTimes(2);
  });

  it("uses fallback roles when staff roles cannot be loaded", async () => {
    const dependencies = {
      organization_use_cases: { get_by_id: vi.fn() },
      team_staff_use_cases: {
        list_staff_roles: vi.fn(async () => ({ success: false, error: "x" })),
        list_staff_by_team: vi.fn(async () => ({
          success: true,
          data: {
            items: [{ role_id: "coach", first_name: "A", last_name: "B" }],
          },
        })),
      },
    } as unknown as MatchReportPageDownloadDependencies;

    const result = await load_match_report_team_staff(
      { home_team_id: "home", away_team_id: "away" } as Fixture,
      dependencies,
    );

    expect(result.home_staff[0].role).toBe("Staff");
  });
});
