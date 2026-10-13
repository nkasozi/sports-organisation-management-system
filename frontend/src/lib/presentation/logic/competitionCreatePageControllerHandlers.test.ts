import { beforeEach, describe, expect, it, vi } from "vitest";

import { create_competition_create_page_controller_runtime } from "./competitionCreatePageControllerRuntime";

const {
  initialize_competition_create_page_mock,
  get_next_selected_team_ids_mock,
  submit_competition_create_form_mock,
  update_competition_auto_squad_submission_mock,
} = vi.hoisted(() => ({
  initialize_competition_create_page_mock: vi.fn(),
  get_next_selected_team_ids_mock: vi.fn(),
  submit_competition_create_form_mock: vi.fn(),
  update_competition_auto_squad_submission_mock: vi.fn(),
}));

vi.mock("$lib/presentation/logic/competitionCreatePageFlow", () => ({
  initialize_competition_create_page: initialize_competition_create_page_mock,
  load_competition_create_organization_state: vi.fn(),
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
  access_denial_store: { set_denial: vi.fn() },
}));

function create_command(): Record<string, ReturnType<typeof vi.fn>> &
  Record<string, unknown> {
  return {
    get_competition_formats: vi.fn(() => [{ id: "format-1" }]),
    get_current_auth_profile_state: vi.fn(() => ({ status: "missing" })),
    get_current_raw_token_state: vi.fn(() => ({ status: "missing" })),
    get_form_data: vi.fn(() => ({ name: "Cup" })),
    get_is_team_count_valid: vi.fn(() => true),
    get_organizations: vi.fn(() => []),
    get_selected_format_state: vi.fn(() => ({ status: "missing" })),
    get_selected_team_ids: vi.fn(() => new Set<string>(["team-1"])),
    goto: vi.fn(async () => {}),
    is_browser: true,
    set_competition_format_options: vi.fn(),
    set_competition_formats: vi.fn(),
    set_error_message: vi.fn(),
    set_form_data: vi.fn(),
    set_is_loading_formats: vi.fn(),
    set_is_loading_organizations: vi.fn(),
    set_is_loading_teams: vi.fn(),
    set_is_saving: vi.fn(),
    set_organization_options: vi.fn(),
    set_organizations: vi.fn(),
    set_selected_format_state: vi.fn(),
    set_selected_sport_state: vi.fn(),
    set_selected_team_ids: vi.fn(),
    set_team_options: vi.fn(),
    show_toast: vi.fn(),
  } as never;
}

describe("competitionCreatePageControllerRuntime handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does nothing on initialize outside the browser", async () => {
    const command = { ...create_command(), is_browser: false };
    await create_competition_create_page_controller_runtime(
      command as never,
    ).initialize();
    expect(initialize_competition_create_page_mock).not.toHaveBeenCalled();
  });

  it("sets the error message and clears loading flags on initialize error", async () => {
    const command = create_command();
    initialize_competition_create_page_mock.mockResolvedValue({
      access_denied: false,
      error_message: "boom",
    });
    await create_competition_create_page_controller_runtime(
      command as never,
    ).initialize();
    expect(initialize_competition_create_page_mock).toHaveBeenCalledWith(
      expect.objectContaining({ is_organization_restricted: false }),
    );
    expect(command.set_error_message).toHaveBeenCalledWith("boom");
    expect(command.set_is_loading_organizations).toHaveBeenCalledWith(false);
    expect(command.set_is_loading_formats).toHaveBeenCalledWith(false);
    expect(command.set_is_loading_teams).toHaveBeenCalledWith(false);
  });

  it("stops loading formats when no organization is preselected", async () => {
    const command = create_command();
    initialize_competition_create_page_mock.mockResolvedValue({
      access_denied: false,
      error_message: "",
      organizations: [{ id: "o" }],
      organization_options: [{ value: "o", label: "O" }],
      preselected_organization_id: "",
    });
    await create_competition_create_page_controller_runtime(
      command as never,
    ).initialize();
    expect(command.set_organizations).toHaveBeenCalledWith([{ id: "o" }]);
    expect(command.set_is_loading_formats).toHaveBeenCalledWith(false);
    expect(command.set_form_data).not.toHaveBeenCalled();
  });

  it("updates the selected format state on format change", () => {
    const command = create_command();
    const runtime = create_competition_create_page_controller_runtime(
      command as never,
    );
    runtime.handle_format_change({ detail: { value: "format-1" } } as never);
    expect(command.set_form_data).toHaveBeenCalledWith({
      name: "Cup",
      competition_format_id: "format-1",
    });
    expect(command.set_selected_format_state).toHaveBeenCalledWith({
      status: "present",
      competition_format: { id: "format-1" },
    });
    runtime.handle_format_change({ detail: { value: "nope" } } as never);
    expect(command.set_selected_format_state).toHaveBeenLastCalledWith({
      status: "missing",
    });
  });

  it("toggles teams and auto squad submission", () => {
    const command = create_command();
    get_next_selected_team_ids_mock.mockReturnValue(new Set(["team-2"]));
    update_competition_auto_squad_submission_mock.mockReturnValue({ a: 1 });
    const runtime = create_competition_create_page_controller_runtime(
      command as never,
    );
    expect(runtime.handle_team_toggle("team-2")).toBe(true);
    expect(get_next_selected_team_ids_mock).toHaveBeenCalledWith(
      new Set(["team-1"]),
      "team-2",
    );
    expect(command.set_selected_team_ids).toHaveBeenCalledWith(
      new Set(["team-2"]),
    );
    runtime.handle_auto_squad_submission_toggle(true);
    expect(update_competition_auto_squad_submission_mock).toHaveBeenCalledWith(
      { name: "Cup" },
      true,
    );
    expect(command.set_form_data).toHaveBeenCalledWith({ a: 1 });
  });

  it("shows the generic invalid team message and submit failures", async () => {
    const command = create_command();
    command.get_is_team_count_valid = vi.fn(() => false);
    const runtime = create_competition_create_page_controller_runtime(
      command as never,
    );
    await runtime.handle_submit();
    expect(command.show_toast).toHaveBeenCalledWith(
      "Please select valid teams for the chosen competition format",
      "error",
    );
    command.get_is_team_count_valid = vi.fn(() => true);
    submit_competition_create_form_mock.mockResolvedValue({
      success: false,
      error_message: "failed",
    });
    await runtime.handle_submit();
    expect(command.set_is_saving).toHaveBeenNthCalledWith(1, true);
    expect(command.set_is_saving).toHaveBeenNthCalledWith(2, false);
    expect(command.show_toast).toHaveBeenLastCalledWith("failed", "error");
    expect(command.goto).not.toHaveBeenCalled();
  });
});
