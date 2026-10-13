import { beforeEach, describe, expect, it, vi } from "vitest";

import { BULK_PLAYER_ASSIGNMENT_MESSAGES } from "./bulkPlayerAssignmentConstants";
import { create_bulk_player_assignment_page_controller_runtime } from "./bulkPlayerAssignmentPageControllerRuntime";

const { check_mock, ensure_mock, load_mock } = vi.hoisted(() => ({
  check_mock: vi.fn(),
  ensure_mock: vi.fn(),
  load_mock: vi.fn(),
}));

vi.mock("$lib/infrastructure/AuthorizationProvider", () => ({
  get_authorization_adapter: () => ({ check_entity_authorized: check_mock }),
}));

vi.mock("./authGuard", () => ({ ensure_auth_profile: ensure_mock }));

vi.mock("./bulkPlayerAssignmentPageData", () => ({
  load_bulk_player_assignment_page_data: load_mock,
  save_bulk_player_assignments: vi.fn(),
}));

function create_command(token_state: Record<string, unknown>): never {
  return {
    dependencies: {},
    get_auth_state: () => ({
      current_profile_state: { status: "missing" },
      current_token_state: token_state,
    }),
    goto: vi.fn(async () => {}),
    is_browser: true,
    set_access_denial: vi.fn(),
    set_all_player_assignments: vi.fn(),
    set_error_message: vi.fn(),
    set_gender_name_map: vi.fn(),
    set_is_loading: vi.fn(),
    set_teams: vi.fn(),
  } as never;
}

describe("bulkPlayerAssignmentPageControllerRuntime access checks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    ensure_mock.mockResolvedValue({ success: true });
    load_mock.mockResolvedValue({
      teams: [],
      all_player_assignments: [],
      gender_name_map: new Map(),
      error_message: "",
    });
  });

  it("stops loading without data when the authorization check fails", async () => {
    check_mock.mockResolvedValueOnce({ success: false, error: "offline" });
    const command = create_command({ status: "present", raw_token: "t" });
    await create_bulk_player_assignment_page_controller_runtime(
      command,
    ).initialize_page();
    expect(Reflect.get(command, "set_is_loading")).toHaveBeenCalledWith(false);
    expect(Reflect.get(command, "set_error_message")).toHaveBeenCalledWith(
      BULK_PLAYER_ASSIGNMENT_MESSAGES.ACCESS_CHECK_FAILED,
    );
    expect(load_mock).not.toHaveBeenCalled();
    expect(Reflect.get(command, "set_access_denial")).not.toHaveBeenCalled();
  });

  it("skips the authorization check when no token is present", async () => {
    const command = create_command({ status: "missing" });
    await create_bulk_player_assignment_page_controller_runtime(
      command,
    ).initialize_page();
    expect(check_mock).not.toHaveBeenCalled();
    expect(load_mock).toHaveBeenCalledWith({
      profile_state: { status: "missing" },
      dependencies: {},
    });
  });

  it("does nothing outside the browser", async () => {
    const command = { ...(create_command({}) as object), is_browser: false };
    await create_bulk_player_assignment_page_controller_runtime(
      command as never,
    ).initialize_page();
    expect(ensure_mock).not.toHaveBeenCalled();
  });
});
