import { beforeEach, describe, expect, it, vi } from "vitest";

const { get_sport_by_id_mock } = vi.hoisted(() => ({
  get_sport_by_id_mock: vi.fn(),
}));

vi.mock("$lib/adapters/persistence/sportService", () => ({
  get_sport_by_id: get_sport_by_id_mock,
}));

import {
  competition_create_status_options,
  load_competition_create_formats,
  load_competition_create_organizations,
  load_competition_create_sport,
  load_competition_create_team_options,
} from "./competitionCreatePageData";

describe("competitionCreatePageData", () => {
  function create_dependencies() {
    return {
      competition_format_use_cases: { list: vi.fn() },
      organization_use_cases: { get_by_id: vi.fn(), list: vi.fn() },
      team_use_cases: { list: vi.fn() },
    };
  }

  beforeEach(() => {
    get_sport_by_id_mock.mockReset();
  });

  it("exposes the expected competition status options", () => {
    expect(competition_create_status_options).toEqual([
      { value: "upcoming", label: "Upcoming" },
      { value: "active", label: "Active" },
      { value: "completed", label: "Completed" },
      { value: "cancelled", label: "Cancelled" },
    ]);
  });

  it("loads only the restricted organization when the auth scope requires it", async () => {
    const dependencies = create_dependencies();
    dependencies.organization_use_cases.get_by_id.mockResolvedValue({
      success: true,
      data: { id: "organization-1", name: "Premier League" },
    });

    await expect(
      load_competition_create_organizations({
        current_auth_profile: { organization_id: "organization-1" } as never,
        dependencies: dependencies as never,
        is_organization_restricted: true,
      }),
    ).resolves.toEqual({
      organizations: [{ id: "organization-1", name: "Premier League" }],
      organization_options: [
        { value: "organization-1", label: "Premier League" },
      ],
      preselected_organization_id: "organization-1",
    });
  });

  it("filters formats to active ones and maps team options from the selected organization", async () => {
    const dependencies = create_dependencies();
    dependencies.competition_format_use_cases.list.mockResolvedValue({
      success: true,
      data: {
        items: [
          { id: "format-1", name: "Round Robin", status: "active" },
          { id: "format-2", name: "Knockout", status: "inactive" },
        ],
      },
    });
    dependencies.team_use_cases.list.mockResolvedValue({
      success: true,
      data: { items: [{ id: "team-1", name: "Lions" }] },
    });

    await expect(
      load_competition_create_formats("organization-1", dependencies as never),
    ).resolves.toEqual({
      competition_formats: [
        { id: "format-1", name: "Round Robin", status: "active" },
      ],
      competition_format_options: [{ value: "format-1", label: "Round Robin" }],
    });
    await expect(
      load_competition_create_team_options(
        "organization-1",
        dependencies as never,
      ),
    ).resolves.toEqual([{ value: "team-1", label: "Lions" }]);
  });

  it("loads the selected sport only when the organization has a valid sport id", async () => {
    get_sport_by_id_mock.mockResolvedValue({
      success: true,
      data: { id: "sport-1", name: "Football" },
    });

    await expect(
      load_competition_create_sport("organization-1", [
        { id: "organization-1", sport_id: "sport-1" },
      ] as never),
    ).resolves.toEqual({ id: "sport-1", name: "Football" });
    await expect(
      load_competition_create_sport("missing", [] as never),
    ).resolves.toBeNull();
  });
});
