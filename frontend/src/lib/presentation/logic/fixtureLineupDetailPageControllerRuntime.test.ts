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
  it("loads detail data and applies the page state on successful initialization", async () => {
    const context = create_command();
    const runtime = create_fixture_lineup_detail_page_controller_runtime(
      context.command,
    );

    await runtime.initialize_page();

    expect(authorize_fixture_lineup_detail_page).toHaveBeenCalledWith(
      {},
      "raw-token",
      "fixture_lineup",
      "read",
      "update",
      "Access check failed",
    );
    expect(load_fixture_lineup_detail_view_data).toHaveBeenCalledWith(
      "lineup_1",
      context.command.get_auth_state().current_profile_state,
      expect.objectContaining({
        get_fixture_lineup_by_id,
        get_fixture_by_id:
          context.command.use_cases.fixture_use_cases.get_by_id,
      }),
    );
    expect(context.set_loading).toHaveBeenCalledWith(true);
    expect(context.set_lineup_state).toHaveBeenCalledWith({
      status: "present",
      lineup: create_lineup(),
    });
    expect(context.set_fixture_state).toHaveBeenCalledWith({
      status: "present",
      fixture: { id: "fixture_1" },
    });
    expect(context.set_home_team_state).toHaveBeenCalledWith({
      status: "present",
      team: { id: "team_home" },
    });
    expect(context.set_away_team_state).toHaveBeenCalledWith({
      status: "present",
      team: { id: "team_away" },
    });
    expect(context.set_loading).toHaveBeenLastCalledWith(false);
  });

  it("redirects when read access is denied before loading any data", async () => {
    authorize_fixture_lineup_detail_page.mockResolvedValue({
      success: true,
      is_read_authorized: false,
      can_modify_lineup: false,
      permission_info_message: "read only",
    });
    const context = create_command();
    const runtime = create_fixture_lineup_detail_page_controller_runtime(
      context.command,
    );

    await runtime.initialize_page();

    expect(context.set_access_denial).toHaveBeenCalledWith(
      "/unauthorized/lineup_1",
      "Access denied",
    );
    expect(context.goto).toHaveBeenCalledWith("/");
    expect(load_fixture_lineup_detail_view_data).not.toHaveBeenCalled();
  });

  it("maps auth failures to the page error state", async () => {
    ensure_auth_profile.mockResolvedValue({
      success: false,
      error_message: "Sign in required",
    });
    const context = create_command();
    const runtime = create_fixture_lineup_detail_page_controller_runtime(
      context.command,
    );

    await runtime.initialize_page();

    expect(context.set_error_message).toHaveBeenCalledWith("Sign in required");
    expect(context.set_loading).toHaveBeenCalledWith(false);
  });
});
