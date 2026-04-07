import type { QuickEventButton } from "$lib/core/entities/Fixture";
import type { PlayerTimeOnStatus } from "$lib/core/entities/FixtureLineup";
import {
  type LiveGameDetailPageActionDependencies,
  record_live_game_detail_page_event_action,
  update_live_game_detail_player_time_on_action,
} from "$lib/presentation/logic/liveGameDetailPageActions";
import {
  create_live_game_detail_event_state,
  get_live_game_detail_event_player,
  type LiveGameDetailDerivedState,
  type LiveGameDetailEventState,
  type LiveGameDetailPageState,
  type LiveGameDetailToastState,
  open_live_game_detail_event_state,
} from "$lib/presentation/logic/liveGameDetailPageState";

import {
  show_live_game_detail_toast,
  update_live_game_detail_state,
} from "./liveGameDetailControllerUtils";

export function create_live_game_detail_event_handlers(command: {
  action_dependencies: LiveGameDetailPageActionDependencies;
  get_event_state: () => LiveGameDetailEventState;
  get_page_state: () => LiveGameDetailPageState;
  get_view_state: () => LiveGameDetailDerivedState;
  set_event_state: (state: LiveGameDetailEventState) => void;
  set_page_state: (state: LiveGameDetailPageState) => void;
  set_toast_state: (state: LiveGameDetailToastState) => void;
}): {
  open_event_modal: (
    event_button: QuickEventButton,
    team_side: "home" | "away",
  ) => void;
  record_event: () => Promise<void>;
  select_event_player: (player_id: string) => void;
  select_secondary_player: (player_id: string) => void;
  update_player_time_on: (
    team_side: "home" | "away",
    player_id: string,
    new_time_on: PlayerTimeOnStatus,
  ) => Promise<boolean>;
} {
  const set_page_state = (
    updater: (state: LiveGameDetailPageState) => LiveGameDetailPageState,
  ): LiveGameDetailPageState =>
    update_live_game_detail_state({
      get_state: command.get_page_state,
      set_state: command.set_page_state,
      updater,
    });

  const set_event_state = (
    updater: (state: LiveGameDetailEventState) => LiveGameDetailEventState,
  ): LiveGameDetailEventState =>
    update_live_game_detail_state({
      get_state: command.get_event_state,
      set_state: command.set_event_state,
      updater,
    });

  return {
    open_event_modal: (event_button, team_side): void => {
      if (!command.get_view_state().is_game_active) return;
      command.set_event_state(
        open_live_game_detail_event_state({
          event_button,
          team_side,
          elapsed_minutes: command.get_view_state().elapsed_minutes,
        }),
      );
    },
    select_event_player: (player_id): void => {
      const selection = get_live_game_detail_event_player({
        players:
          command.get_event_state().selected_team_side === "home"
            ? command.get_page_state().home_players
            : command.get_page_state().away_players,
        player_id,
      });
      set_event_state((event_state) => ({
        ...event_state,
        selected_player_id: selection.player_id,
        event_player_name: selection.player_name,
      }));
    },
    select_secondary_player: (player_id): void => {
      const selection = get_live_game_detail_event_player({
        players:
          command.get_event_state().selected_team_side === "home"
            ? command.get_page_state().home_players
            : command.get_page_state().away_players,
        player_id,
      });
      set_event_state((event_state) => ({
        ...event_state,
        secondary_player_id: selection.player_id,
        secondary_player_name: selection.player_name,
      }));
    },
    update_player_time_on: async (
      team_side,
      player_id,
      new_time_on,
    ): Promise<boolean> => {
      const page_state = command.get_page_state();
      const result = await update_live_game_detail_player_time_on_action({
        team_side,
        player_id,
        new_time_on,
        home_lineup_id: page_state.home_lineup_id,
        away_lineup_id: page_state.away_lineup_id,
        home_players: page_state.home_players,
        away_players: page_state.away_players,
        fixture_lineup_use_cases:
          command.action_dependencies.fixture_lineup_use_cases,
      });
      set_page_state((current_page_state) => ({
        ...current_page_state,
        home_players: result.updated_home_players,
        away_players: result.updated_away_players,
      }));
      if (!result.success)
        show_live_game_detail_toast(
          command.set_toast_state,
          result.error_message,
          "error",
        );
      return result.success;
    },
    record_event: async (): Promise<void> => {
      const page_state = command.get_page_state();
      const event_state = command.get_event_state();
      if (!page_state.fixture || !event_state.selected_event_type) return;
      set_page_state((current_page_state) => ({
        ...current_page_state,
        is_updating: true,
      }));
      const result = await record_live_game_detail_page_event_action({
        fixture_id: page_state.fixture.id,
        selected_event_type: event_state.selected_event_type,
        event_minute: event_state.event_minute,
        selected_team_side: event_state.selected_team_side,
        event_player_name: event_state.event_player_name,
        event_description: event_state.event_description,
        secondary_player_name: event_state.secondary_player_name,
        is_substitution_event: command.get_view_state().is_substitution_event,
        selected_player_id: event_state.selected_player_id,
        home_lineup_id: page_state.home_lineup_id,
        away_lineup_id: page_state.away_lineup_id,
        home_players: page_state.home_players,
        away_players: page_state.away_players,
        fixture_use_cases: command.action_dependencies.fixture_use_cases,
        fixture_lineup_use_cases:
          command.action_dependencies.fixture_lineup_use_cases,
      });
      set_page_state((current_page_state) => ({
        ...current_page_state,
        is_updating: false,
      }));
      if (!result.success) {
        show_live_game_detail_toast(
          command.set_toast_state,
          result.error_message,
          "error",
        );
        return;
      }
      command.set_event_state(create_live_game_detail_event_state());
      set_page_state((current_page_state) => ({
        ...current_page_state,
        fixture: result.fixture,
        home_players: result.updated_home_players,
        away_players: result.updated_away_players,
      }));
      show_live_game_detail_toast(
        command.set_toast_state,
        result.warning_message || result.toast_message,
        result.warning_message ? "error" : "success",
      );
    },
  };
}
