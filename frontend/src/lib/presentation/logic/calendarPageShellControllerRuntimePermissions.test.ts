import { beforeEach, describe, expect, it, vi } from "vitest";

import { ANY_VALUE } from "$lib/core/interfaces/ports";

import { create_calendar_page_shell_controller_runtime } from "./calendarPageShellControllerRuntime";
import { create_calendar_shell_command } from "./calendarPageShellControllerRuntime.test_support";

const { create_calendar_page_shell_controller_activity_actions_mock } =
  vi.hoisted(() => ({
    create_calendar_page_shell_controller_activity_actions_mock: vi.fn(),
  }));

vi.mock(
  "$lib/presentation/logic/calendarPageShellControllerRuntimeActivity",
  () => ({
    create_calendar_page_shell_controller_activity_actions:
      create_calendar_page_shell_controller_activity_actions_mock,
  }),
);

vi.mock(
  "$lib/presentation/logic/calendarPageShellControllerRuntimeLoading",
  () => ({
    clear_calendar_shell_filters: vi.fn(),
    handle_calendar_shell_filter_change: vi.fn(),
    handle_calendar_shell_organization_change: vi.fn(),
    initialize_calendar_shell: vi.fn(),
  }),
);

const READ_ONLY_PERMISSIONS = {
  can_create_activity: false,
  can_edit_activity: false,
  can_delete_activity: false,
  can_create_category: false,
};

function read_can_user_add_activities(): boolean {
  const activity_command =
    create_calendar_page_shell_controller_activity_actions_mock.mock
      .calls[0][0];
  return activity_command.get_can_user_add_activities();
}

describe("calendarPageShellControllerRuntime permissions", () => {
  beforeEach(() => {
    create_calendar_page_shell_controller_activity_actions_mock.mockReset();
    create_calendar_page_shell_controller_activity_actions_mock.mockReturnValue(
      {},
    );
  });

  it("does not let a read-only role add activities even with an organization-wide scope", () => {
    const { command } = create_calendar_shell_command();
    command.get_current_auth_profile_state = () =>
      ({
        status: "present",
        profile: { organization_id: ANY_VALUE, team_id: ANY_VALUE },
      }) as never;
    command.get_calendar_activity_permissions = () => READ_ONLY_PERMISSIONS;

    create_calendar_page_shell_controller_runtime(command as never);

    expect(read_can_user_add_activities()).toBe(false);
  });

  it("lets a role with create rights add activities within its organization scope", () => {
    const { command } = create_calendar_shell_command();

    create_calendar_page_shell_controller_runtime(command as never);

    expect(read_can_user_add_activities()).toBe(true);
  });
});
