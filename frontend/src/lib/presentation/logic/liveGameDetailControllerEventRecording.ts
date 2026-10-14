import type { QuickEventButton } from "$lib/core/entities/Fixture";
import type {
  LineupPlayer,
  PlayerTimeOnStatus,
} from "$lib/core/entities/FixtureLineup";
import { create_none_option, create_some_option } from "$lib/core/types/Option";
import {
  record_live_game_detail_page_event_action,
  update_live_game_detail_player_time_on_action,
} from "$lib/presentation/logic/liveGameDetailPageActions";
import {
  create_live_game_detail_event_state,
  type LiveGameDetailEventState,
  type LiveGameDetailPageState,
} from "$lib/presentation/logic/liveGameDetailPageState";

import { TEAM_SIDE } from "./gameEventConstants";
import type { LiveGameDetailEventHandlersCommand } from "./liveGameDetailControllerEventSelection";
import {
  set_live_game_detail_updating,
  update_live_game_detail_page_state,
} from "./liveGameDetailControllerStateAccess";
import { show_live_game_detail_toast } from "./liveGameDetailControllerUtils";
import type { EventTimingContext } from "./liveGameEventTiming";
import {
  derive_player_availability,
  type PlayerAvailability,
} from "./liveGamePlayerAvailability";
import { resolve_card_severity_rules } from "./liveGameSportCardRules";
import {
  type EffectiveSubstitutionRules,
  resolve_substitution_rules,
} from "./liveGameSubstitutionRules";
import { TOAST_KIND } from "./toastConfig";

type LiveGameDetailFixtureId = NonNullable<
  LiveGameDetailPageState["fixture"]
>["id"];

type RecordEventResult = Awaited<
  ReturnType<typeof record_live_game_detail_page_event_action>
>;

export async function update_live_game_detail_player_time_on(
  command: LiveGameDetailEventHandlersCommand,
  team_side: "home" | "away",
  player_id: string,
  new_time_on: PlayerTimeOnStatus,
): Promise<boolean> {
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
  update_live_game_detail_page_state(command, (current_page_state) => ({
    ...current_page_state,
    home_players: result.updated_home_players,
    away_players: result.updated_away_players,
  }));
  if (!result.success)
    show_live_game_detail_toast(
      command.set_toast_state,
      result.error_message,
      TOAST_KIND.ERROR,
    );
  return result.success;
}

type TeamSubstitutionContext = {
  on_field_players: LineupPlayer[];
  substitution_availability: PlayerAvailability;
  substitution_rules: EffectiveSubstitutionRules;
};

function build_team_substitution_context(
  command: LiveGameDetailEventHandlersCommand,
  event_state: LiveGameDetailEventState,
): TeamSubstitutionContext {
  const page_state = command.get_page_state();
  const players =
    event_state.selected_team_side === TEAM_SIDE.HOME
      ? page_state.home_players
      : page_state.away_players;
  const availability = derive_player_availability(
    players,
    page_state.fixture?.game_events ?? [],
    event_state.selected_team_side,
    resolve_card_severity_rules(page_state.sport, page_state.competition),
  );
  return {
    on_field_players: players.filter((player) =>
      availability.on_field_ids.has(String(player.id)),
    ),
    substitution_availability: availability,
    substitution_rules: resolve_substitution_rules(
      page_state.sport,
      page_state.competition,
    ),
  };
}

function build_event_timing_context(
  command: LiveGameDetailEventHandlersCommand,
): EventTimingContext {
  const view_state = command.get_view_state();
  return {
    effective_periods: view_state.effective_periods,
    current_period_id: view_state.current_period_id
      ? create_some_option(view_state.current_period_id)
      : create_none_option(),
    elapsed_minutes: view_state.elapsed_minutes,
  };
}

function submit_live_game_detail_event(
  command: LiveGameDetailEventHandlersCommand,
  page_state: LiveGameDetailPageState,
  event_state: LiveGameDetailEventState,
  fixture_id: LiveGameDetailFixtureId,
  selected_event_type: QuickEventButton,
): Promise<RecordEventResult> {
  return record_live_game_detail_page_event_action({
    fixture_id,
    selected_event_type,
    event_minute: event_state.event_minute,
    selected_team_side: event_state.selected_team_side,
    event_player_name: event_state.event_player_name,
    event_description: event_state.event_description,
    secondary_player_name: event_state.secondary_player_name,
    secondary_player_id: event_state.secondary_player_id,
    ...build_team_substitution_context(command, event_state),
    max_players_on_field: command.get_view_state().max_players_on_field,
    event_timing: build_event_timing_context(command),
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
}

function apply_recorded_event_result(
  command: LiveGameDetailEventHandlersCommand,
  result: RecordEventResult,
): void {
  if (!result.success) {
    show_live_game_detail_toast(
      command.set_toast_state,
      result.error_message,
      TOAST_KIND.ERROR,
    );
    return;
  }
  command.set_event_state(create_live_game_detail_event_state());
  update_live_game_detail_page_state(command, (current_page_state) => ({
    ...current_page_state,
    fixture: result.fixture,
    home_players: result.updated_home_players,
    away_players: result.updated_away_players,
  }));
  show_live_game_detail_toast(
    command.set_toast_state,
    result.warning_message || result.toast_message,
    result.warning_message ? TOAST_KIND.ERROR : TOAST_KIND.SUCCESS,
  );
}

export async function record_live_game_detail_event(
  command: LiveGameDetailEventHandlersCommand,
): Promise<void> {
  const page_state = command.get_page_state();
  const event_state = command.get_event_state();
  if (!page_state.fixture || !event_state.selected_event_type) return;
  set_live_game_detail_updating(command, true);
  const result = await submit_live_game_detail_event(
    command,
    page_state,
    event_state,
    page_state.fixture.id,
    event_state.selected_event_type,
  );
  set_live_game_detail_updating(command, false);
  apply_recorded_event_result(command, result);
}
