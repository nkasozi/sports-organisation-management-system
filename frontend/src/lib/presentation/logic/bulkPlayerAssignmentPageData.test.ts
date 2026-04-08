import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  build_authorization_list_filter_mock,
  build_player_assignments_mock,
  create_membership_input_mock,
  get_selected_player_assignments_mock,
  get_today_date_mock,
} = vi.hoisted(() => ({
  build_authorization_list_filter_mock: vi.fn(),
  build_player_assignments_mock: vi.fn(),
  create_membership_input_mock: vi.fn(),
  get_selected_player_assignments_mock: vi.fn(),
  get_today_date_mock: vi.fn(),
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

vi.mock("$lib/presentation/logic/bulkPlayerAssignmentPageState", () => ({
  build_player_assignments: build_player_assignments_mock,
  create_membership_input: create_membership_input_mock,
  get_selected_player_assignments: get_selected_player_assignments_mock,
  get_today_date: get_today_date_mock,
}));

import {
  build_bulk_player_assignment_auth_filter,
  load_bulk_player_assignment_page_data,
  save_bulk_player_assignments,
} from "./bulkPlayerAssignmentPageData";

describe("bulkPlayerAssignmentPageData", () => {
  function create_dependencies() {
    return {
      gender_use_cases: { list: vi.fn() },
      membership_use_cases: { create: vi.fn(), list: vi.fn() },
      player_use_cases: { list: vi.fn() },
      team_use_cases: { list: vi.fn() },
    };
  }

  beforeEach(() => {
    build_authorization_list_filter_mock.mockReset();
    build_player_assignments_mock.mockReset();
    create_membership_input_mock.mockReset();
    get_selected_player_assignments_mock.mockReset();
    get_today_date_mock.mockReset();
  });

  it("builds an authorization filter from the current profile and returns empty when none exists", () => {
    build_authorization_list_filter_mock.mockReturnValue({
      organization_id: "organization-1",
    });

    expect(build_bulk_player_assignment_auth_filter(null)).toEqual({});
    expect(
      build_bulk_player_assignment_auth_filter({
        organization_id: "organization-1",
      } as never),
    ).toEqual({
      organization_id: "organization-1",
    });
  });

  it("returns an error when teams cannot be loaded and otherwise assembles page data", async () => {
    const error_dependencies = create_dependencies();
    error_dependencies.team_use_cases.list.mockResolvedValue({
      success: false,
    });

    await expect(
      load_bulk_player_assignment_page_data({
        current_profile: null,
        dependencies: error_dependencies as never,
      }),
    ).resolves.toEqual({
      teams: [],
      all_player_assignments: [],
      gender_name_map: new Map(),
      error_message: "Failed to load teams",
    });

    const dependencies = create_dependencies();
    build_authorization_list_filter_mock.mockReturnValue({
      organization_id: "organization-1",
    });
    get_today_date_mock.mockReturnValue("2024-06-01");
    build_player_assignments_mock.mockReturnValue([{ player_id: "player-1" }]);
    dependencies.team_use_cases.list.mockResolvedValue({
      success: true,
      data: { items: [{ id: "team-1", name: "Lions" }] },
    });
    dependencies.player_use_cases.list.mockResolvedValue({
      success: true,
      data: { items: [{ id: "player-1" }] },
    });
    dependencies.membership_use_cases.list.mockResolvedValue({
      success: true,
      data: { items: [{ id: "membership-1" }] },
    });
    dependencies.gender_use_cases.list.mockResolvedValue({
      success: true,
      data: { items: [{ id: "gender-1", name: "Women" }] },
    });

    await expect(
      load_bulk_player_assignment_page_data({
        current_profile: { organization_id: "organization-1" } as never,
        dependencies: dependencies as never,
      }),
    ).resolves.toEqual({
      teams: [{ id: "team-1", name: "Lions" }],
      all_player_assignments: [{ player_id: "player-1" }],
      gender_name_map: new Map([["gender-1", "Women"]]),
      error_message: "",
    });
  });

  it("saves each selected assignment and counts successes and failures", async () => {
    const dependencies = create_dependencies();
    get_selected_player_assignments_mock.mockReturnValue([
      { id: "assignment-1" },
      { id: "assignment-2" },
    ]);
    create_membership_input_mock
      .mockReturnValueOnce({ player_id: "player-1" })
      .mockReturnValueOnce({ player_id: "player-2" });
    dependencies.membership_use_cases.create
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: false });

    await expect(
      save_bulk_player_assignments({
        assigned_players_on_other_teams: [],
        dependencies: dependencies as never,
        selected_team: { id: "team-1", name: "Lions" } as never,
        selected_team_id: "team-1",
        unassigned_players: [],
      }),
    ).resolves.toEqual({ success_count: 1, error_count: 1 });
  });
});
