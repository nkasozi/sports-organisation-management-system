import { beforeEach, describe, expect, it, vi } from "vitest";

import { create_competition_create_page_controller_runtime } from "./competitionCreatePageControllerRuntime";

const {
  initialize_competition_create_page_mock,
  load_competition_create_organization_state_mock,
  get_next_selected_team_ids_mock,
  set_denial_mock,
  submit_competition_create_form_mock,
  update_competition_auto_squad_submission_mock,
} = vi.hoisted(() => ({
  initialize_competition_create_page_mock: vi.fn(),
  load_competition_create_organization_state_mock: vi.fn(),
  get_next_selected_team_ids_mock: vi.fn(),
  set_denial_mock: vi.fn(),
  submit_competition_create_form_mock: vi.fn(),
  update_competition_auto_squad_submission_mock: vi.fn(),
}));

vi.mock("$lib/presentation/logic/competitionCreatePageFlow", () => ({
  initialize_competition_create_page: initialize_competition_create_page_mock,
  load_competition_create_organization_state:
    load_competition_create_organization_state_mock,
}));

vi.mock("$lib/presentation/logic/competitionCreatePageState", () => ({
  get_next_selected_team_ids: get_next_selected_team_ids_mock,
  update_competition_auto_squad_submission:
    update_competition_auto_squad_submission_mock,
}));

vi.mock("$lib/presentation/logic/competitionCreatePageSubmit", () => ({
  submit_competition_create_form: submit_competition_create_form_mock,
}));

vi.mock("$lib/presentation/stores/accessDenial", () => ({
  access_denial_store: {
    set_denial: set_denial_mock,
  },
}));

describe("competitionCreatePageControllerRuntime", () => {
  function create_command() {
    const state = {
      competition_formats: [
        { id: "format-1", min_teams_required: 2, max_teams_allowed: 4 },
      ],
      form_data: {
        organization_id: "",
        competition_format_id: "",
        rule_overrides: {},
      },
      is_loading_formats: true,
      is_loading_organizations: true,
      is_loading_teams: true,
      is_saving: false,
      organizations: [{ id: "organization-1", name: "Premier League" }],
      selected_format_state: {
        status: "present",
        competition_format: {
          id: "format-1",
          min_teams_required: 2,
          max_teams_allowed: 4,
        },
      } as
        | {
            status: "present";
            competition_format: {
              id: string;
              min_teams_required: number;
              max_teams_allowed: number;
            };
          }
        | { status: "missing" },
      selected_team_ids: new Set<string>(),
      team_options: [] as unknown[],
    };

    const command = {
      get_competition_formats: () => state.competition_formats as never,
      get_current_auth_profile_state: () => ({
        status: "present",
        profile: { organization_id: "organization-1" } as never,
      }),
      get_current_raw_token_state: () => ({
        status: "present",
        value: "token-1",
      }),
      get_form_data: () => state.form_data as never,
      get_is_team_count_valid: () => true,
      get_organizations: () => state.organizations as never,
      get_selected_format_state: () => state.selected_format_state as never,
      get_selected_team_ids: () => state.selected_team_ids,
      goto: vi.fn(async () => {}),
      is_browser: true,
      set_competition_format_options: vi.fn(),
      set_competition_formats: vi.fn(
        (value: typeof state.competition_formats) => {
          state.competition_formats = value;
        },
      ),
      set_error_message: vi.fn(),
      set_form_data: vi.fn((value: typeof state.form_data) => {
        state.form_data = value;
      }),
      set_is_loading_formats: vi.fn((value: boolean) => {
        state.is_loading_formats = value;
      }),
      set_is_loading_organizations: vi.fn((value: boolean) => {
        state.is_loading_organizations = value;
      }),
      set_is_loading_teams: vi.fn((value: boolean) => {
        state.is_loading_teams = value;
      }),
      set_is_saving: vi.fn((value: boolean) => {
        state.is_saving = value;
      }),
      set_organization_options: vi.fn(),
      set_organizations: vi.fn((value: typeof state.organizations) => {
        state.organizations = value;
      }),
      set_selected_format_state: vi.fn(
        (value: typeof state.selected_format_state) => {
          state.selected_format_state = value;
        },
      ),
      set_selected_sport_state: vi.fn(),
      set_selected_team_ids: vi.fn((value: Set<string>) => {
        state.selected_team_ids = value;
      }),
      set_team_options: vi.fn((value: unknown[]) => {
        state.team_options = value;
      }),
      show_toast: vi.fn(),
    };

    return { command, state };
  }

  beforeEach(() => {
    vi.useRealTimers();
    get_next_selected_team_ids_mock.mockReset();
    initialize_competition_create_page_mock.mockReset();
    load_competition_create_organization_state_mock.mockReset();
    set_denial_mock.mockReset();
    submit_competition_create_form_mock.mockReset();
    update_competition_auto_squad_submission_mock.mockReset();
  });

  it("redirects to competitions when initialization reports access denied", async () => {
    const { command } = create_command();
    initialize_competition_create_page_mock.mockResolvedValue({
      access_denied: true,
      error_message: "",
    });

    await create_competition_create_page_controller_runtime(
      command as never,
    ).initialize();

    expect(set_denial_mock).toHaveBeenCalledWith(
      "/competitions/create",
      "You do not have permission to create competitions.",
    );
    expect(command.goto).toHaveBeenCalledWith("/competitions");
  });

  it("loads preselected organization state during initialization", async () => {
    const { command, state } = create_command();
    initialize_competition_create_page_mock.mockResolvedValue({
      access_denied: false,
      error_message: "",
      organizations: [{ id: "organization-1", name: "Premier League" }],
      organization_options: [
        { value: "organization-1", label: "Premier League" },
      ],
      preselected_organization_id: "organization-1",
    });
    load_competition_create_organization_state_mock.mockResolvedValue({
      team_options: [{ value: "team-1", label: "Lions" }],
      competition_formats: [{ id: "format-1" }],
      competition_format_options: [{ value: "format-1", label: "Round Robin" }],
      selected_sport_state: {
        status: "present",
        sport: { id: "sport-1" },
      },
    });

    await create_competition_create_page_controller_runtime(
      command as never,
    ).initialize();

    expect(initialize_competition_create_page_mock).toHaveBeenCalledWith({
      current_auth_profile_state: {
        status: "present",
        profile: { organization_id: "organization-1" },
      },
      dependencies: expect.any(Object),
      is_organization_restricted: true,
      raw_token_state: { status: "present", value: "token-1" },
    });
    expect(state.form_data.organization_id).toBe("organization-1");
    expect(command.set_team_options).toHaveBeenCalledWith([
      { value: "team-1", label: "Lions" },
    ]);
    expect(state.is_loading_formats).toBe(false);
    expect(state.is_loading_teams).toBe(false);
  });

  it("resets dependent state and reloads side effects when the organization changes", async () => {
    const { command, state } = create_command();
    load_competition_create_organization_state_mock.mockResolvedValue({
      team_options: [{ value: "team-2", label: "Tigers" }],
      competition_formats: [{ id: "format-2" }],
      competition_format_options: [{ value: "format-2", label: "Knockout" }],
      selected_sport_state: {
        status: "present",
        sport: { id: "sport-2" },
      },
    });

    await create_competition_create_page_controller_runtime(
      command as never,
    ).handle_organization_change({
      detail: { value: "organization-2" },
    } as never);

    expect(state.form_data.organization_id).toBe("organization-2");
    expect(state.selected_team_ids).toEqual(new Set());
    expect(command.set_selected_format_state).toHaveBeenCalledWith({
      status: "missing",
    });
  });

  it("shows validation errors for invalid team counts and navigates after a successful submit", async () => {
    const invalid = create_command();
    invalid.command.get_is_team_count_valid = () => false;
    await create_competition_create_page_controller_runtime(
      invalid.command as never,
    ).handle_submit();
    expect(invalid.command.show_toast).toHaveBeenCalledWith(
      "Please select between 2 and 4 teams",
      "error",
    );

    const valid = create_command();
    vi.useFakeTimers();
    submit_competition_create_form_mock.mockResolvedValue({
      success: true,
      error_message: "",
    });
    await create_competition_create_page_controller_runtime(
      valid.command as never,
    ).handle_submit();
    vi.advanceTimersByTime(1500);
    expect(valid.command.show_toast).toHaveBeenCalledWith(
      "Competition created successfully!",
      "success",
    );
    expect(valid.command.goto).toHaveBeenCalledWith("/competitions");
  });
});
