import { browser } from "$app/environment";
import { get_authorization_adapter } from "$lib/infrastructure/AuthorizationProvider";
import { ensure_auth_profile } from "$lib/presentation/logic/authGuard";
import {
  type LiveGameDetailDataDependencies,
  load_live_game_detail_bundle,
} from "$lib/presentation/logic/liveGameDetailData";
import { derive_live_game_detail_view_state } from "$lib/presentation/logic/liveGameDetailPageDerivedState";
import {
  apply_live_game_detail_bundle,
  type LiveGameDetailEventState,
  type LiveGameDetailPageState,
} from "$lib/presentation/logic/liveGameDetailPageState";
import { access_denial_store } from "$lib/presentation/stores/accessDenial";

import { update_live_game_detail_state } from "./liveGameDetailControllerUtils";

export function create_live_game_detail_clock_handlers(command: {
  data_dependencies: LiveGameDetailDataDependencies;
  fixture_id: () => string;
  get_event_state: () => LiveGameDetailEventState;
  get_page_state: () => LiveGameDetailPageState;
  goto: (path: string) => Promise<unknown>;
  raw_token: () => string;
  set_page_state: (state: LiveGameDetailPageState) => void;
}): {
  cleanup: () => void;
  initialize: () => Promise<void>;
  load_fixture_or_error: () => Promise<void>;
  reload_fixture_bundle: () => Promise<LiveGameDetailPageState["fixture"]>;
  start_clock: () => void;
  stop_clock: () => void;
  toggle_clock: () => void;
} {
  let clock_interval_state:
    | { status: "stopped" }
    | { status: "running"; interval_id: ReturnType<typeof setInterval> } = {
    status: "stopped",
  };

  const set_page_state = (
    updater: (state: LiveGameDetailPageState) => LiveGameDetailPageState,
  ): LiveGameDetailPageState =>
    update_live_game_detail_state({
      get_state: command.get_page_state,
      set_state: command.set_page_state,
      updater,
    });

  const stop_clock = (): void => {
    if (clock_interval_state.status === "running") {
      clearInterval(clock_interval_state.interval_id);
    }
    clock_interval_state = { status: "stopped" };
    set_page_state((page_state) => ({
      ...page_state,
      is_clock_running: false,
    }));
  };

  const start_clock = (): void => {
    if (
      clock_interval_state.status === "running" ||
      (command.get_page_state().fixture?.status === "completed" &&
        command.get_page_state().extra_time_added_seconds <= 0)
    )
      return;
    set_page_state((page_state) => ({ ...page_state, is_clock_running: true }));
    const interval_id = setInterval(() => {
      const page_state = command.get_page_state();
      const view_state = derive_live_game_detail_view_state({
        page_state,
        event_state: command.get_event_state(),
      });
      set_page_state((current_page_state) =>
        page_state.fixture?.current_period &&
        !view_state.is_current_period_playing
          ? {
              ...current_page_state,
              break_elapsed_seconds:
                current_page_state.break_elapsed_seconds + 1,
            }
          : {
              ...current_page_state,
              game_clock_seconds: current_page_state.game_clock_seconds + 1,
            },
      );
    }, 1000);
    clock_interval_state = { status: "running", interval_id };
  };

  const reload_fixture_bundle = async (): Promise<
    LiveGameDetailPageState["fixture"]
  > => {
    const result = await load_live_game_detail_bundle(
      command.fixture_id(),
      command.data_dependencies,
    );
    if (!result.success) {
      set_page_state((page_state) => ({
        ...page_state,
        error_message: result.error_message,
      }));
      return;
    }
    set_page_state((page_state) =>
      result.data.fixture.status === "completed"
        ? {
            ...apply_live_game_detail_bundle(page_state, result.data),
            home_lineup_expanded: true,
            away_lineup_expanded: true,
          }
        : apply_live_game_detail_bundle(page_state, result.data),
    );
    return result.data.fixture;
  };

  const load_fixture = async (): Promise<void> => {
    set_page_state((page_state) => ({
      ...page_state,
      is_loading: true,
      error_message: "",
    }));
    const fixture = await reload_fixture_bundle();
    set_page_state((page_state) => ({ ...page_state, is_loading: false }));
    if (fixture?.status === "in_progress") start_clock();
  };

  const load_fixture_or_error = async (): Promise<void> => {
    if (command.fixture_id()) {
      await load_fixture();
      return;
    }
    set_page_state((page_state) => ({
      ...page_state,
      error_message: "No fixture ID provided",
      is_loading: false,
    }));
  };

  return {
    initialize: async (): Promise<void> => {
      if (!browser) return;
      const auth_result = await ensure_auth_profile();
      if (!auth_result.success) {
        set_page_state((page_state) => ({
          ...page_state,
          error_message: auth_result.error_message,
          is_loading: false,
        }));
        return;
      }
      const raw_token = command.raw_token();
      if (raw_token) {
        const read_result =
          await get_authorization_adapter().check_entity_authorized(
            raw_token,
            "fixture",
            "read",
          );
        if (read_result.success && !read_result.data.is_authorized) {
          access_denial_store.set_denial(
            `/live-games/${command.fixture_id()}`,
            "You do not have permission to view this live game.",
          );
          void command.goto("/");
          return;
        }
        const update_result =
          await get_authorization_adapter().check_entity_authorized(
            raw_token,
            "fixture",
            "update",
          );
        set_page_state((page_state) => ({
          ...page_state,
          can_modify_game:
            update_result.success && update_result.data.is_authorized,
          permission_info_message:
            update_result.success && update_result.data.is_authorized
              ? ""
              : "You have view-only access to this live game. Game management actions are not available.",
        }));
      }
      await load_fixture_or_error();
    },
    cleanup: (): void => stop_clock(),
    load_fixture_or_error,
    reload_fixture_bundle,
    start_clock,
    stop_clock,
    toggle_clock: (): void => {
      if (command.get_page_state().is_clock_running) {
        stop_clock();
        return;
      }
      start_clock();
    },
  };
}
