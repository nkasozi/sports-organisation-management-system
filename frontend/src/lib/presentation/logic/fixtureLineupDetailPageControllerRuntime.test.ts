import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { FixtureLineup } from "$lib/core/entities/FixtureLineup";
import type { TeamPlayer } from "$lib/core/services/teamPlayers";

import type {
  FixtureLineupDetailLineupState,
  FixtureLineupDetailProfileState,
  FixtureLineupDetailTokenState,
} from "./fixtureLineupDetailPageContracts";
import { create_fixture_lineup_detail_page_controller_runtime } from "./fixtureLineupDetailPageControllerRuntime";

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

function create_lineup(overrides: Partial<FixtureLineup> = {}): FixtureLineup {
  return {
    id: "lineup_1",
    organization_id: "org_1",
    fixture_id: "fixture_1",
    team_id: "team_1",
    selected_players: [],
    status: "draft",
    submitted_by: "Coach 1",
    submitted_at: "2026-01-01T00:00:00Z",
    notes: "Ready",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  } as FixtureLineup;
}

function create_team_player(overrides: Partial<TeamPlayer> = {}): TeamPlayer {
  return {
    id: "player_1",
    first_name: "Jordan",
    last_name: "Miles",
    gender_id: "gender_1",
    email: "player@example.com",
    phone: "123",
    date_of_birth: "2000-01-01",
    position_id: "position_1",
    organization_id: "org_1",
    height_cm: 0,
    weight_kg: 0,
    nationality: "UG",
    profile_image_url: "",
    emergency_contact_name: "Coach",
    emergency_contact_phone: "123",
    medical_notes: "",
    status: "active",
    jersey_number: 9,
    position: "Forward",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  } as TeamPlayer;
}

function create_command() {
  let lineup_state: FixtureLineupDetailLineupState = {
    status: "present",
    lineup: create_lineup(),
  };
  let team_players = [create_team_player()] as TeamPlayer[];
  const goto = vi.fn(async () => {});
  const set_access_denial = vi.fn();
  const set_away_team_state = vi.fn();
  const set_can_modify_lineup = vi.fn();
  const set_error_message = vi.fn();
  const set_fixture_state = vi.fn();
  const set_home_team_state = vi.fn();
  const set_lineup_state = vi.fn((value: FixtureLineupDetailLineupState) => {
    lineup_state = value;
  });
  const set_loading = vi.fn();
  const set_permission_info_message = vi.fn();
  const set_saving = vi.fn();
  const set_team_state = vi.fn();
  const set_team_players = vi.fn((value: TeamPlayer[]) => {
    team_players = value;
  });

  const command = {
    access_denied_message: "Access denied",
    access_denial_path: "/unauthorized",
    access_check_failed_message: "Access check failed",
    entity_type: "fixture_lineup",
    get_auth_state: (): {
      current_profile_state: FixtureLineupDetailProfileState;
      current_token_state: FixtureLineupDetailTokenState;
    } => ({
      current_profile_state: {
        status: "present",
        organization_scope_state: {
          status: "scoped",
          organization_id: "org_1",
        },
      },
      current_token_state: { status: "present", raw_token: "raw-token" },
    }),
    get_lineup_state: () => lineup_state,
    get_team_players: () => team_players,
    goto,
    is_browser: true,
    lineup_id: "lineup_1",
    lineup_list_path: "/fixture-lineups",
    read_action: "read" as const,
    set_access_denial,
    set_away_team_state,
    set_can_modify_lineup,
    set_error_message,
    set_fixture_state,
    set_home_team_state,
    set_lineup_state,
    set_loading,
    set_permission_info_message,
    set_saving,
    set_team_state,
    set_team_players,
    submit_confirmation: "Submit lineup?",
    submit_failed_message: "Submit failed",
    update_action: "update" as const,
    update_failed_message: "Update failed",
    use_cases: {
      fixture_lineup_use_cases: { update: vi.fn() },
      fixture_use_cases: { get_by_id: vi.fn() },
      membership_use_cases: { list_memberships_by_team: vi.fn() },
      player_position_use_cases: { list: vi.fn() },
      player_use_cases: { list_players_by_team: vi.fn() },
      team_use_cases: { get_by_id: vi.fn() },
    },
  };

  return {
    command,
    goto,
    set_access_denial,
    set_away_team_state,
    set_can_modify_lineup,
    set_error_message,
    set_fixture_state,
    set_home_team_state,
    set_lineup_state,
    set_loading,
    set_permission_info_message,
    set_saving,
    set_team_state,
    set_team_players,
    get_current_lineup_state: () => lineup_state,
  };
}

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
