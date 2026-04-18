import { describe, expect, it, vi } from "vitest";

import {
  build_assigned_officials,
  build_staff_entries,
  build_staff_roles_map,
  COMPETITION_RESULTS_MATCH_REPORT_TEXT,
  resolve_match_report_organization_name,
} from "./competitionResultsMatchReportHelpers";

describe("competitionResultsMatchReportHelpers", () => {
  it("builds staff entries with mapped and fallback role names", async () => {
    await expect(
      build_staff_entries("team_1", new Map([["role_1", "Coach"]]), {
        list_staff_by_team: vi.fn().mockResolvedValue({
          success: true,
          data: {
            items: [
              {
                first_name: "Grace",
                last_name: "Namutebi",
                role_id: "role_1",
              },
              {
                first_name: "Alex",
                last_name: "Kato",
                role_id: "unknown",
              },
            ],
          },
        }),
      } as never),
    ).resolves.toEqual([
      { role: "Coach", name: "Grace Namutebi" },
      {
        role: COMPETITION_RESULTS_MATCH_REPORT_TEXT.fallback_staff_role,
        name: "Alex Kato",
      },
    ]);
  });

  it("resolves the organization name and staff-role map with safe fallbacks", async () => {
    await expect(
      resolve_match_report_organization_name({ status: "missing" }, {
        organization_use_cases: { get_by_id: vi.fn() },
      } as never),
    ).resolves.toBe(
      COMPETITION_RESULTS_MATCH_REPORT_TEXT.default_organization_name,
    );

    await expect(
      resolve_match_report_organization_name(
        {
          status: "present",
          competition: { organization_id: "org_1" } as never,
        },
        {
          organization_use_cases: {
            get_by_id: vi.fn().mockResolvedValue({
              success: true,
              data: { name: "Uganda Hockey Association" },
            }),
          },
        } as never,
      ),
    ).resolves.toBe("UGANDA HOCKEY ASSOCIATION");

    await expect(
      build_staff_roles_map({
        team_staff_use_cases: {
          list_staff_roles: vi.fn().mockResolvedValue({
            success: true,
            data: [{ id: "role_1", name: "Coach" }],
          }),
        },
      } as never),
    ).resolves.toEqual(new Map([["role_1", "Coach"]]));
  });

  it("builds assigned officials while skipping unresolved official records", async () => {
    await expect(
      build_assigned_officials(
        {
          assigned_officials: [
            { official_id: "official_1", role_name: "Umpire" },
            { official_id: "official_2", role_name: "Judge" },
          ],
        } as never,
        {
          official_use_cases: {
            get_by_id: vi
              .fn()
              .mockResolvedValueOnce({
                success: true,
                data: { id: "official_1" },
              })
              .mockResolvedValueOnce({ success: false, error: "missing" }),
          },
        } as never,
      ),
    ).resolves.toEqual([
      { official: { id: "official_1" }, role_name: "Umpire" },
    ]);
  });
});
