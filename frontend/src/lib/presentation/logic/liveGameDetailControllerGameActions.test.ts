import { beforeEach, describe, expect, it, vi } from "vitest";

import { create_live_game_detail_game_handlers } from "./liveGameDetailControllerGameActions";
import type {
  LiveGameDetailModalState,
  LiveGameDetailPageState,
  LiveGameDetailToastState,
} from "./liveGameDetailPageState";
import {
  create_live_game_detail_modal_state,
  create_live_game_detail_page_state,
} from "./liveGameDetailPageStateFactories";

const { end_live_game_detail_action_mock, start_live_game_detail_action_mock } =
  vi.hoisted(() => ({
    end_live_game_detail_action_mock: vi.fn(),
    start_live_game_detail_action_mock: vi.fn(),
  }));

vi.mock("$lib/presentation/logic/liveGameDetailPageActions", () => ({
  end_live_game_detail_action: end_live_game_detail_action_mock,
  start_live_game_detail_action: start_live_game_detail_action_mock,
}));

describe("liveGameDetailControllerGameActions", () => {
  type HandlerCommand = Parameters<
    typeof create_live_game_detail_game_handlers
  >[0];
  type MockActionDependencies = {
    [Key in keyof HandlerCommand["action_dependencies"]]?: Partial<
      HandlerCommand["action_dependencies"][Key]
    >;
  };

  function create_lineup_player(
    id: string,
  ): LiveGameDetailPageState["home_players"][number] {
    return {
      id,
      first_name: "Ada",
      last_name: "Stone",
      jersey_number: 0,
      position: "",
      is_captain: false,
      is_substitute: false,
    } as LiveGameDetailPageState["home_players"][number];
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function create_state_store() {
    let page_state = {
      ...create_live_game_detail_page_state(),
      fixture: {
        id: "fixture-1",
        status: "scheduled",
      } as LiveGameDetailPageState["fixture"],
      competition: {
        allow_auto_squad_submission: true,
      } as LiveGameDetailPageState["competition"],
      home_team: { name: "Lions" } as LiveGameDetailPageState["home_team"],
      away_team: { name: "Tigers" } as LiveGameDetailPageState["away_team"],
      home_players: [create_lineup_player("home-1")],
      away_players: [create_lineup_player("away-1")],
    } as LiveGameDetailPageState;
    let modal_state = {
      ...create_live_game_detail_modal_state(),
      show_start_modal: true,
      show_end_modal: true,
    } as LiveGameDetailModalState;
    let toast_state:
      | { status: "hidden" }
      | { status: "visible"; toast: LiveGameDetailToastState } = {
      status: "hidden",
    };
    return {
      get_modal_state: () => modal_state,
      get_page_state: () => page_state,
      read_modal_state: () => modal_state,
      read_page_state: () => page_state,
      read_toast_state: () =>
        toast_state.status === "visible" ? toast_state.toast : void 0,
      set_modal_state: (next_state: typeof modal_state) => {
        modal_state = next_state;
      },
      set_page_state: (next_state: typeof page_state) => {
        page_state = next_state;
      },
      set_toast_state: (next_state: LiveGameDetailToastState) => {
        toast_state = { status: "visible", toast: next_state };
      },
    };
  }

  it("starts the game, closes the modal, resets the clock, and shows a success toast", async () => {
    const state_store = create_state_store();
    const start_clock = vi.fn();
    start_live_game_detail_action_mock.mockResolvedValue({
      success: true,
      fixture: { id: "fixture-1", status: "in_progress" },
      toast_message: "Game started! Clock is running.",
    });
    const action_dependencies = {
      fixture_use_cases: {},
    } satisfies MockActionDependencies;
    const handlers = create_live_game_detail_game_handlers({
      action_dependencies:
        action_dependencies as HandlerCommand["action_dependencies"],
      get_modal_state: state_store.get_modal_state,
      get_page_state: state_store.get_page_state,
      get_view_state: () => ({
        away_score: 0,
        elapsed_minutes: 0,
        home_score: 0,
        playing_periods: [],
      }),
      reload_fixture_bundle: vi.fn(),
      set_modal_state: state_store.set_modal_state,
      set_page_state: state_store.set_page_state,
      set_toast_state: state_store.set_toast_state,
      start_clock,
      stop_clock: vi.fn(),
    });

    await handlers.start_game();

    expect(start_live_game_detail_action_mock).toHaveBeenCalledWith(
      expect.objectContaining({
        allow_auto_submission: true,
        reload_fixture: expect.any(Function),
      }),
    );
    expect(start_clock).toHaveBeenCalled();
    expect(state_store.read_modal_state()).toEqual(
      expect.objectContaining({ show_start_modal: false }),
    );
    expect(state_store.read_page_state()).toEqual(
      expect.objectContaining({
        fixture: { id: "fixture-1", status: "in_progress" },
        game_clock_seconds: 0,
        is_updating: false,
      }),
    );
    expect(state_store.read_toast_state()).toEqual({
      is_visible: true,
      message: "Game started! Clock is running.",
      type: "success",
    });
  });

  it("shows an error toast when starting the game fails", async () => {
    const state_store = create_state_store();
    const start_clock = vi.fn();
    start_live_game_detail_action_mock.mockResolvedValue({
      success: false,
      error_message: "Lineups missing",
    });
    const action_dependencies = {
      fixture_use_cases: {},
    } satisfies MockActionDependencies;
    const handlers = create_live_game_detail_game_handlers({
      action_dependencies:
        action_dependencies as HandlerCommand["action_dependencies"],
      get_modal_state: state_store.get_modal_state,
      get_page_state: state_store.get_page_state,
      get_view_state: () => ({
        away_score: 0,
        elapsed_minutes: 0,
        home_score: 0,
        playing_periods: [],
      }),
      reload_fixture_bundle: vi.fn(),
      set_modal_state: state_store.set_modal_state,
      set_page_state: state_store.set_page_state,
      set_toast_state: state_store.set_toast_state,
      start_clock,
      stop_clock: vi.fn(),
    });

    await handlers.start_game();

    expect(start_clock).not.toHaveBeenCalled();
    expect(state_store.read_toast_state()).toEqual({
      is_visible: true,
      message: "Lineups missing",
      type: "error",
    });
  });

  it("ends the game, expands both lineups, and shows the completion toast", async () => {
    const state_store = create_state_store();
    const stop_clock = vi.fn();
    end_live_game_detail_action_mock.mockResolvedValue({
      success: true,
      fixture: { id: "fixture-1", status: "completed" },
    });
    const action_dependencies = {
      fixture_use_cases: {},
    } satisfies MockActionDependencies;
    const handlers = create_live_game_detail_game_handlers({
      action_dependencies:
        action_dependencies as HandlerCommand["action_dependencies"],
      get_modal_state: state_store.get_modal_state,
      get_page_state: state_store.get_page_state,
      get_view_state: () => ({
        away_score: 1,
        elapsed_minutes: 90,
        home_score: 2,
        playing_periods: [],
      }),
      reload_fixture_bundle: vi.fn(),
      set_modal_state: state_store.set_modal_state,
      set_page_state: state_store.set_page_state,
      set_toast_state: state_store.set_toast_state,
      start_clock: vi.fn(),
      stop_clock,
    });

    await handlers.end_game();

    expect(stop_clock).toHaveBeenCalled();
    expect(state_store.read_modal_state()).toEqual(
      expect.objectContaining({ show_end_modal: false }),
    );
    expect(state_store.read_page_state()).toEqual(
      expect.objectContaining({
        fixture: { id: "fixture-1", status: "completed" },
        home_lineup_expanded: true,
        away_lineup_expanded: true,
        is_updating: false,
      }),
    );
    expect(state_store.read_toast_state()).toEqual({
      is_visible: true,
      message: "Game completed!",
      type: "success",
    });
  });
});
