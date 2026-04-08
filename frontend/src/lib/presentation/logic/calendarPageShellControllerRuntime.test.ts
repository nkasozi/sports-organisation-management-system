import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  create_calendar_page_shell_controller_activity_actions_mock,
  get_store_value_mock,
  is_public_viewer_store,
  load_calendar_shell_bundle_mock,
  load_calendar_shell_events_mock,
  load_calendar_shell_initial_data_mock,
  public_organization_store_mock,
  set_public_organization_mock,
} = vi.hoisted(() => ({
  create_calendar_page_shell_controller_activity_actions_mock: vi.fn(),
  get_store_value_mock: vi.fn(),
  is_public_viewer_store: { kind: "is_public_viewer" },
  load_calendar_shell_bundle_mock: vi.fn(),
  load_calendar_shell_events_mock: vi.fn(),
  load_calendar_shell_initial_data_mock: vi.fn(),
  public_organization_store_mock: { kind: "public_organization_store" },
  set_public_organization_mock: vi.fn(),
}));

vi.mock("svelte/store", () => ({
  get: get_store_value_mock,
}));

vi.mock("$lib/presentation/logic/calendarPageShellControllerData", () => ({
  load_calendar_shell_bundle: load_calendar_shell_bundle_mock,
  load_calendar_shell_events: load_calendar_shell_events_mock,
}));

vi.mock(
  "$lib/presentation/logic/calendarPageShellControllerInitialData",
  () => ({
    load_calendar_shell_initial_data: load_calendar_shell_initial_data_mock,
  }),
);

vi.mock(
  "$lib/presentation/logic/calendarPageShellControllerRuntimeActivity",
  () => ({
    create_calendar_page_shell_controller_activity_actions:
      create_calendar_page_shell_controller_activity_actions_mock,
  }),
);

vi.mock("$lib/presentation/stores/auth", () => ({
  is_public_viewer: is_public_viewer_store,
}));

vi.mock("$lib/presentation/stores/publicOrganization", () => ({
  public_organization_store: Object.assign(public_organization_store_mock, {
    set_organization: set_public_organization_mock,
  }),
}));

import { create_calendar_page_shell_controller_runtime } from "./calendarPageShellControllerRuntime";

describe("calendarPageShellControllerRuntime", () => {
  function create_command() {
    const state = {
      organizations: [{ id: "organization-1", name: "Org One" }],
      selected_organization_id: "organization-1",
    };

    const command = {
      get_activity_form_values: () => ({ title: "Training" }) as never,
      get_calendar_events: () => [{ id: "event-1" }] as never,
      get_categories: () => [{ id: "category-1" }] as never,
      get_current_auth_profile: () =>
        ({ organization_id: "organization-1" }) as never,
      get_editing_activity: () => null,
      get_filter_category_id: () => "category-1",
      get_filter_competition_id: () => "competition-1",
      get_filter_team_id: () => "team-1",
      get_organizations: () => state.organizations as never,
      get_selected_organization_id: () => state.selected_organization_id,
      get_selected_organization_name: () => "Org One",
      get_url_org_id: () => "",
      set_activity_form_values: vi.fn(),
      set_calendar_events: vi.fn(),
      set_categories: vi.fn(),
      set_competitions: vi.fn(),
      set_editing_activity: vi.fn(),
      set_error_message: vi.fn(),
      set_filter_category_id: vi.fn(),
      set_filter_competition_id: vi.fn(),
      set_filter_loading: vi.fn(),
      set_filter_team_id: vi.fn(),
      set_is_using_cached_data: vi.fn(),
      set_loading_state: vi.fn(),
      set_organizations: vi.fn((value: unknown[]) => {
        state.organizations = value as never;
      }),
      set_selected_event_details: vi.fn(),
      set_selected_organization_id: vi.fn((value: string) => {
        state.selected_organization_id = value;
      }),
      set_show_category_modal: vi.fn(),
      set_show_create_modal: vi.fn(),
      set_show_subscribe_modal: vi.fn(),
      set_teams: vi.fn(),
      show_toast: vi.fn(),
      use_cases: {} as never,
    };

    return { command, state };
  }

  beforeEach(() => {
    create_calendar_page_shell_controller_activity_actions_mock.mockReset();
    get_store_value_mock.mockReset();
    load_calendar_shell_bundle_mock.mockReset();
    load_calendar_shell_events_mock.mockReset();
    load_calendar_shell_initial_data_mock.mockReset();
    set_public_organization_mock.mockReset();
    create_calendar_page_shell_controller_activity_actions_mock.mockReturnValue(
      {},
    );
    get_store_value_mock.mockImplementation((store: unknown) => {
      if (store === is_public_viewer_store) return false;
      if (store === public_organization_store_mock)
        return { organization_id: "organization-2" };
      return undefined;
    });
  });

  it("initializes the page with the loaded bundle and reports initialization failures", async () => {
    const failed_case = create_command();
    load_calendar_shell_initial_data_mock.mockResolvedValueOnce({
      success: false,
      error_message: "load failed",
    });

    await create_calendar_page_shell_controller_runtime(
      failed_case.command as never,
    ).initialize();
    expect(failed_case.command.set_error_message).toHaveBeenCalledWith(
      "load failed",
    );
    expect(failed_case.command.set_loading_state).toHaveBeenCalledWith("error");

    const success_case = create_command();
    load_calendar_shell_initial_data_mock.mockResolvedValueOnce({
      success: true,
      is_using_cached_data: true,
      organizations: [{ id: "organization-1" }],
      selected_organization_id: "organization-1",
      bundle: {
        teams: [{ id: "team-1" }],
        competitions: [{ id: "competition-1" }],
        categories: [{ id: "category-1" }],
        calendar_events: [{ id: "event-1" }],
      },
    });

    await create_calendar_page_shell_controller_runtime(
      success_case.command as never,
    ).initialize();
    expect(success_case.command.set_is_using_cached_data).toHaveBeenCalledWith(
      true,
    );
    expect(success_case.command.set_organizations).toHaveBeenCalledWith([
      { id: "organization-1" },
    ]);
    expect(success_case.command.set_calendar_events).toHaveBeenCalledWith([
      { id: "event-1" },
    ]);
    expect(success_case.command.set_loading_state).toHaveBeenLastCalledWith(
      "success",
    );
  });

  it("refreshes filtered events and clears filters by reloading the current bundle", async () => {
    const { command } = create_command();
    load_calendar_shell_events_mock.mockResolvedValueOnce([{ id: "event-2" }]);
    load_calendar_shell_bundle_mock.mockResolvedValueOnce({
      teams: [{ id: "team-2" }],
      competitions: [{ id: "competition-2" }],
      categories: [{ id: "category-2" }],
      calendar_events: [{ id: "event-3" }],
    });
    const runtime = create_calendar_page_shell_controller_runtime(
      command as never,
    );

    await runtime.handle_filter_change();
    await runtime.clear_filters();

    expect(command.set_filter_loading).toHaveBeenCalledWith(true);
    expect(command.set_calendar_events).toHaveBeenCalledWith([
      { id: "event-2" },
    ]);
    expect(command.set_filter_category_id).toHaveBeenCalledWith("");
    expect(command.set_filter_competition_id).toHaveBeenCalledWith("");
    expect(command.set_filter_team_id).toHaveBeenCalledWith("");
    expect(command.set_categories).toHaveBeenCalledWith([{ id: "category-2" }]);
  });

  it("updates the public organization store when the viewer changes organizations on the public page", async () => {
    const { command } = create_command();
    get_store_value_mock.mockImplementation((store: unknown) => {
      if (store === is_public_viewer_store) return true;
      if (store === public_organization_store_mock)
        return { organization_id: "organization-2" };
      return undefined;
    });
    load_calendar_shell_bundle_mock.mockResolvedValueOnce({
      teams: [],
      competitions: [],
      categories: [],
      calendar_events: [],
    });
    const runtime = create_calendar_page_shell_controller_runtime(
      command as never,
    );

    await runtime.handle_organization_change();

    expect(set_public_organization_mock).toHaveBeenCalledWith(
      "organization-1",
      "Org One",
    );
    expect(command.set_loading_state).toHaveBeenCalledWith("loading");
    expect(command.set_loading_state).toHaveBeenLastCalledWith("success");
  });

  it("skips filter and organization refresh work when no organization is selected", async () => {
    const { command } = create_command();
    command.get_selected_organization_id = () => "";
    const runtime = create_calendar_page_shell_controller_runtime(
      command as never,
    );

    await runtime.handle_filter_change();
    await runtime.handle_organization_change();

    expect(load_calendar_shell_events_mock).not.toHaveBeenCalled();
    expect(load_calendar_shell_bundle_mock).not.toHaveBeenCalled();
  });
});
