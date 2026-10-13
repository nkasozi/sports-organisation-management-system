import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { create_fixture_lineup_detail_page_controller_runtime } from "./fixtureLineupDetailPageControllerRuntime";
import {
  create_command,
  create_lineup,
  create_team_player,
} from "./fixtureLineupDetailPageControllerRuntime.test_support";

const fixture_lineup_detail_page_controller_mocks = vi.hoisted(() => ({
  get_authorization_adapter: vi.fn(),
  ensure_auth_profile: vi.fn(),
  authorize_fixture_lineup_detail_page: vi.fn(),
  save_fixture_lineup_changes: vi.fn(),
  submit_fixture_lineup_changes: vi.fn(),
  load_fixture_lineup_detail_view_data: vi.fn(),
  submit_lineup: vi.fn(),
  get_fixture_lineup_by_id: vi.fn(),
}));

vi.mock("$lib/adapters/persistence/fixtureLineupService", () => ({
  get_fixture_lineup_by_id:
    fixture_lineup_detail_page_controller_mocks.get_fixture_lineup_by_id,
  submit_lineup: fixture_lineup_detail_page_controller_mocks.submit_lineup,
}));

vi.mock("$lib/infrastructure/AuthorizationProvider", () => ({
  get_authorization_adapter:
    fixture_lineup_detail_page_controller_mocks.get_authorization_adapter,
}));

vi.mock("./authGuard", () => ({
  ensure_auth_profile:
    fixture_lineup_detail_page_controller_mocks.ensure_auth_profile,
}));

vi.mock("./fixtureLineupDetailPageActions", () => ({
  authorize_fixture_lineup_detail_page:
    fixture_lineup_detail_page_controller_mocks.authorize_fixture_lineup_detail_page,
  save_fixture_lineup_changes:
    fixture_lineup_detail_page_controller_mocks.save_fixture_lineup_changes,
  submit_fixture_lineup_changes:
    fixture_lineup_detail_page_controller_mocks.submit_fixture_lineup_changes,
}));

vi.mock("./fixtureLineupDetailPageData", () => ({
  load_fixture_lineup_detail_view_data:
    fixture_lineup_detail_page_controller_mocks.load_fixture_lineup_detail_view_data,
}));

const get_authorization_adapter =
  fixture_lineup_detail_page_controller_mocks.get_authorization_adapter;
const ensure_auth_profile =
  fixture_lineup_detail_page_controller_mocks.ensure_auth_profile;
const authorize_fixture_lineup_detail_page =
  fixture_lineup_detail_page_controller_mocks.authorize_fixture_lineup_detail_page;
const save_fixture_lineup_changes =
  fixture_lineup_detail_page_controller_mocks.save_fixture_lineup_changes;
const submit_fixture_lineup_changes =
  fixture_lineup_detail_page_controller_mocks.submit_fixture_lineup_changes;
const load_fixture_lineup_detail_view_data =
  fixture_lineup_detail_page_controller_mocks.load_fixture_lineup_detail_view_data;
const submit_lineup = fixture_lineup_detail_page_controller_mocks.submit_lineup;
const get_fixture_lineup_by_id =
  fixture_lineup_detail_page_controller_mocks.get_fixture_lineup_by_id;

beforeEach((): void => {
  ensure_auth_profile.mockResolvedValue({ success: true });
  get_authorization_adapter.mockReturnValue({});
  authorize_fixture_lineup_detail_page.mockResolvedValue({
    success: true,
    is_read_authorized: true,
    can_modify_lineup: true,
    permission_info_message: "",
  });
  load_fixture_lineup_detail_view_data.mockResolvedValue({
    success: true,
    data: {
      lineup: create_lineup(),
      fixture_state: { status: "present", fixture: { id: "fixture_1" } },
      team_state: { status: "present", team: { id: "team_1" } },
      team_players: [create_team_player()],
      home_team_state: { status: "present", team: { id: "team_home" } },
      away_team_state: { status: "present", team: { id: "team_away" } },
    },
  });
  save_fixture_lineup_changes.mockResolvedValue({ success: true });
  submit_fixture_lineup_changes.mockResolvedValue({ success: true });
  vi.stubGlobal(
    "confirm",
    vi.fn(() => true),
  );
});

afterEach((): void => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("create_fixture_lineup_detail_page_controller_runtime", () => {
  it("toggles player selection, saves successfully, and redirects to the lineup list", async () => {
    const context = create_command();
    const runtime = create_fixture_lineup_detail_page_controller_runtime(
      context.command,
    );

    runtime.handle_toggle_player_selection("player_1");
    await runtime.handle_save();

    const current_lineup_state = context.get_current_lineup_state();

    expect(current_lineup_state).toEqual({
      status: "present",
      lineup: expect.objectContaining({
        selected_players: [expect.objectContaining({ id: "player_1" })],
      }),
    });
    if (current_lineup_state.status !== "present") {
      return;
    }
    expect(save_fixture_lineup_changes).toHaveBeenCalledWith(
      "lineup_1",
      current_lineup_state.lineup,
      context.command.use_cases.fixture_lineup_use_cases.update,
      "Update failed",
    );
    expect(context.goto).toHaveBeenCalledWith("/fixture-lineups");
  });

  it("submits only after confirmation and surfaces submit failures", async () => {
    submit_fixture_lineup_changes.mockResolvedValueOnce({
      success: false,
      error_message: "Submit failed",
    });
    const context = create_command();
    const runtime = create_fixture_lineup_detail_page_controller_runtime(
      context.command,
    );

    await runtime.handle_submit();

    expect(submit_fixture_lineup_changes).toHaveBeenCalledWith(
      "lineup_1",
      submit_lineup,
      "Submit failed",
    );
    expect(context.set_error_message).toHaveBeenCalledWith("Submit failed");
  });
});
