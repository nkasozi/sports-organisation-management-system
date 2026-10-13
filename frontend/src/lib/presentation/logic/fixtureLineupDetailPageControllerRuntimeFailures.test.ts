import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";

import { create_fixture_lineup_detail_page_controller_runtime } from "./fixtureLineupDetailPageControllerRuntime";

const mocks = vi.hoisted(() => ({
  ensure_auth_profile: vi.fn(),
  authorize_fixture_lineup_detail_page: vi.fn(),
  load_fixture_lineup_detail_view_data: vi.fn(),
  save_fixture_lineup_changes: vi.fn(),
}));

vi.mock("$lib/adapters/persistence/fixtureLineupService", () => ({
  get_fixture_lineup_by_id: vi.fn(),
  submit_lineup: vi.fn(),
}));
vi.mock("$lib/infrastructure/AuthorizationProvider", () => ({
  get_authorization_adapter: vi.fn(() => ({})),
}));
vi.mock("./authGuard", () => ({
  ensure_auth_profile: mocks.ensure_auth_profile,
}));
vi.mock("./fixtureLineupDetailPageActions", () => ({
  authorize_fixture_lineup_detail_page:
    mocks.authorize_fixture_lineup_detail_page,
  save_fixture_lineup_changes: mocks.save_fixture_lineup_changes,
  submit_fixture_lineup_changes: vi.fn(),
}));
vi.mock("./fixtureLineupDetailPageData", () => ({
  load_fixture_lineup_detail_view_data:
    mocks.load_fixture_lineup_detail_view_data,
}));

type FailureTestCommand = {
  is_browser: boolean;
  lineup_id: string;
  lineup_list_path: string;
  update_failed_message: string;
  get_auth_state: () => {
    current_profile_state: { status: string };
    current_token_state: Record<string, unknown>;
  };
  get_lineup_state: () => { status: string; lineup: { id: string } };
  use_cases: Record<string, Record<string, Mock>>;
  goto: Mock;
  set_error_message: Mock;
  set_loading: Mock;
  set_saving: Mock;
  set_lineup_state: Mock;
};

function create_command(
  token_state: Record<string, unknown>,
): FailureTestCommand {
  return {
    is_browser: true,
    lineup_id: "lineup-1",
    lineup_list_path: "/fixture-lineups",
    update_failed_message: "update failed",
    get_auth_state: () => ({
      current_profile_state: { status: "missing" },
      current_token_state: token_state,
    }),
    get_lineup_state: () => ({ status: "present", lineup: { id: "lineup-1" } }),
    use_cases: {
      fixture_lineup_use_cases: { update: vi.fn() },
      fixture_use_cases: { get_by_id: vi.fn() },
      team_use_cases: { get_by_id: vi.fn() },
      player_use_cases: { list_players_by_team: vi.fn() },
      membership_use_cases: { list_memberships_by_team: vi.fn() },
      player_position_use_cases: { list: vi.fn() },
    },
    goto: vi.fn(async () => {}),
    set_error_message: vi.fn(),
    set_loading: vi.fn(),
    set_saving: vi.fn(),
    set_lineup_state: vi.fn(),
  };
}

describe("fixtureLineupDetailPageControllerRuntime failures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.ensure_auth_profile.mockResolvedValue({ success: true });
  });

  it("stops when the authorization check fails", async () => {
    const command = create_command({ status: "present", raw_token: "t" });
    mocks.authorize_fixture_lineup_detail_page.mockResolvedValue({
      success: false,
      error_message: "access check failed",
    });
    await create_fixture_lineup_detail_page_controller_runtime(
      command as never,
    ).initialize_page();
    expect(command.set_error_message).toHaveBeenCalledWith(
      "access check failed",
    );
    expect(command.set_loading).toHaveBeenCalledWith(false);
    expect(mocks.load_fixture_lineup_detail_view_data).not.toHaveBeenCalled();
  });

  it("loads without authorization when no token exists and reports load failures", async () => {
    const command = create_command({ status: "missing" });
    mocks.load_fixture_lineup_detail_view_data.mockResolvedValue({
      success: false,
      error_message: "load failed",
    });
    await create_fixture_lineup_detail_page_controller_runtime(
      command as never,
    ).initialize_page();
    expect(mocks.authorize_fixture_lineup_detail_page).not.toHaveBeenCalled();
    expect(command.set_loading.mock.calls).toEqual([[true], [false]]);
    expect(command.set_error_message.mock.calls).toEqual([
      [""],
      ["load failed"],
    ]);
    expect(command.set_lineup_state).not.toHaveBeenCalled();
  });

  it("keeps the user on the page when saving fails", async () => {
    const command = create_command({ status: "missing" });
    mocks.save_fixture_lineup_changes.mockResolvedValue({
      success: false,
      error_message: "update failed",
    });
    await create_fixture_lineup_detail_page_controller_runtime(
      command as never,
    ).handle_save();
    expect(command.set_saving.mock.calls).toEqual([[true], [false]]);
    expect(command.set_error_message).toHaveBeenLastCalledWith("update failed");
    expect(command.goto).not.toHaveBeenCalled();
  });
});
