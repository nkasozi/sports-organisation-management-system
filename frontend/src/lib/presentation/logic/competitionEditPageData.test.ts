import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  build_authorization_list_filter_mock,
  create_competition_update_form_data_mock,
  get_sport_by_id_mock,
} = vi.hoisted(() => ({
  build_authorization_list_filter_mock: vi.fn(),
  create_competition_update_form_data_mock: vi.fn(),
  get_sport_by_id_mock: vi.fn(),
}));

vi.mock("$lib/core/interfaces/ports", async () => {
  const actual = await vi.importActual<
    typeof import("$lib/core/interfaces/ports")
  >("$lib/core/interfaces/ports");
  return {
    ...actual,
    build_authorization_list_filter: build_authorization_list_filter_mock,
  };
});

vi.mock("$lib/adapters/persistence/sportService", () => ({
  get_sport_by_id: get_sport_by_id_mock,
}));

vi.mock("./competitionEditPageState", () => ({
  create_competition_update_form_data: create_competition_update_form_data_mock,
}));

import {
  build_competition_edit_auth_filter,
  load_competition_edit_page_data,
  load_competition_edit_sport,
} from "./competitionEditPageData";

describe("competitionEditPageData", () => {
  function create_dependencies() {
    return {
      competition_format_use_cases: { list: vi.fn() },
      competition_team_use_cases: { list_teams_in_competition: vi.fn() },
      competition_use_cases: { get_by_id: vi.fn() },
      organization_use_cases: { list: vi.fn() },
      team_use_cases: { list: vi.fn() },
    };
  }

  beforeEach(() => {
    build_authorization_list_filter_mock.mockReset();
    create_competition_update_form_data_mock.mockReset();
    get_sport_by_id_mock.mockReset();
  });

  it("builds the auth filter from the current profile and leaves anonymous access unfiltered", () => {
    build_authorization_list_filter_mock.mockReturnValue({
      organization_id: "organization-1",
    });

    expect(build_competition_edit_auth_filter(null)).toEqual({});
    expect(
      build_competition_edit_auth_filter({
        organization_id: "organization-1",
      } as never),
    ).toEqual({ organization_id: "organization-1" });
  });

  it("loads the selected organization sport only when the organization exposes a valid sport", async () => {
    await expect(
      load_competition_edit_sport(
        [{ id: "organization-1" }] as never,
        "organization-1",
      ),
    ).resolves.toBeNull();

    get_sport_by_id_mock.mockResolvedValueOnce({ success: false });
    await expect(
      load_competition_edit_sport(
        [{ id: "organization-1", sport_id: "sport-1" }] as never,
        "organization-1",
      ),
    ).resolves.toBeNull();

    get_sport_by_id_mock.mockResolvedValueOnce({
      success: true,
      data: { id: "sport-1", name: "Football" },
    });
    await expect(
      load_competition_edit_sport(
        [{ id: "organization-1", sport_id: "sport-1" }] as never,
        "organization-1",
      ),
    ).resolves.toEqual({ id: "sport-1", name: "Football" });
  });

  it("returns load failures and assembles edit-page state on success", async () => {
    const failed_dependencies = create_dependencies();
    failed_dependencies.competition_use_cases.get_by_id.mockResolvedValueOnce({
      success: false,
      error: "boom",
    });
    failed_dependencies.organization_use_cases.list.mockResolvedValueOnce({
      success: true,
      data: { items: [] },
    });
    failed_dependencies.team_use_cases.list.mockResolvedValueOnce({
      success: true,
      data: { items: [] },
    });
    failed_dependencies.competition_team_use_cases.list_teams_in_competition.mockResolvedValueOnce(
      {
        success: true,
        data: { items: [] },
      },
    );
    failed_dependencies.competition_format_use_cases.list.mockResolvedValueOnce(
      { success: true, data: { items: [] } },
    );

    await expect(
      load_competition_edit_page_data({
        competition_id: "competition-1",
        current_profile: null,
        current_profile_organization_id: undefined,
        dependencies: failed_dependencies as never,
      }),
    ).resolves.toEqual({ success: false, error_message: "boom" });

    const dependencies = create_dependencies();
    const competition = {
      id: "competition-1",
      competition_format_id: "format-1",
      organization_id: "organization-1",
      rule_overrides: { points_config_override: { points_for_win: 3 } },
    };
    const organizations = [
      { id: "organization-1", sport_id: "sport-1" },
      { id: "organization-2", sport_id: "sport-2" },
    ];
    const teams = [{ id: "team-1", name: "Lions" }];
    const competition_team_entries = [{ id: "entry-1", team_id: "team-1" }];
    const competition_formats = [
      { id: "format-1", name: "League", status: "active" },
      { id: "format-2", name: "Archived", status: "inactive" },
    ];
    const form_data = { id: "competition-1", name: "League" };

    dependencies.competition_use_cases.get_by_id.mockResolvedValueOnce({
      success: true,
      data: competition,
    });
    dependencies.organization_use_cases.list.mockResolvedValueOnce({
      success: true,
      data: { items: organizations },
    });
    dependencies.team_use_cases.list.mockResolvedValueOnce({
      success: true,
      data: { items: teams },
    });
    dependencies.competition_team_use_cases.list_teams_in_competition.mockResolvedValueOnce(
      {
        success: true,
        data: { items: competition_team_entries },
      },
    );
    dependencies.competition_format_use_cases.list.mockResolvedValueOnce({
      success: true,
      data: { items: competition_formats },
    });
    create_competition_update_form_data_mock.mockReturnValueOnce(form_data);
    get_sport_by_id_mock.mockResolvedValueOnce({
      success: true,
      data: { id: "sport-1", name: "Football" },
    });

    await expect(
      load_competition_edit_page_data({
        competition_id: "competition-1",
        current_profile: { organization_id: "organization-1" } as never,
        current_profile_organization_id: "organization-1",
        dependencies: dependencies as never,
      }),
    ).resolves.toEqual({
      success: true,
      data: {
        competition,
        organizations: [{ id: "organization-1", sport_id: "sport-1" }],
        competition_formats: [
          { id: "format-1", name: "League", status: "active" },
        ],
        all_teams: teams,
        competition_team_entries,
        form_data,
        selected_format: { id: "format-1", name: "League", status: "active" },
        selected_sport: { id: "sport-1", name: "Football" },
        is_customizing_scoring: true,
      },
    });
  });
});
