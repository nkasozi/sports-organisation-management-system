import type { GameEvent } from "$lib/core/entities/Fixture";
import {
  get_default_time_on_for_player,
  type LineupPlayer,
} from "$lib/core/entities/FixtureLineup";
import { GAME_EVENT_LOG_TYPE } from "$lib/core/entities/GameEventLogTypes";
import type { GameEventCorrection } from "$lib/core/usecases/FixtureGameEventCorrections";

import { TEAM_SIDE } from "./gameEventConstants";
import type { LiveGameDetailEventHandlersCommand } from "./liveGameDetailControllerEventSelection";
import { update_live_game_detail_page_state } from "./liveGameDetailControllerStateAccess";
import { show_live_game_detail_toast } from "./liveGameDetailControllerUtils";
import { TOAST_KIND } from "./toastConfig";

export const LIVE_EVENT_CORRECTION_KIND = {
  EDIT: "edit",
  REMOVE: "remove",
} as const;

export type LiveEventCorrectionRequest =
  | {
      kind: typeof LIVE_EVENT_CORRECTION_KIND.EDIT;
      event: GameEvent;
      correction: GameEventCorrection;
    }
  | { kind: typeof LIVE_EVENT_CORRECTION_KIND.REMOVE; event: GameEvent };

const CORRECTION_MESSAGE = {
  EDITED: "Event updated",
  REMOVED: "Event removed",
  LINEUP_NOT_RESTORED:
    "The substitution was removed, but the lineup could not be restored. Please check the lineup.",
} as const;
const NO_TIME_OFF = "";

export function undo_substitution_in_lineup(
  players: readonly LineupPlayer[],
  event: GameEvent,
): LineupPlayer[] {
  return players.map((player) => {
    if (String(player.id) === String(event.player_id ?? ""))
      return { ...player, time_on: get_default_time_on_for_player(true) };
    if (String(player.id) === String(event.secondary_player_id ?? ""))
      return { ...player, time_off: NO_TIME_OFF };
    return player;
  });
}

async function restore_lineup_after_removed_substitution(
  command: LiveGameDetailEventHandlersCommand,
  event: GameEvent,
): Promise<boolean> {
  if (event.event_type !== GAME_EVENT_LOG_TYPE.SUBSTITUTION) return true;
  const page_state = command.get_page_state();
  const is_home = event.team_side === TEAM_SIDE.HOME;
  const players = undo_substitution_in_lineup(
    is_home ? page_state.home_players : page_state.away_players,
    event,
  );
  const result =
    await command.action_dependencies.fixture_lineup_use_cases.record_live_player_times(
      {
        lineup_id: is_home
          ? page_state.home_lineup_id
          : page_state.away_lineup_id,
        selected_players: players,
      },
    );
  update_live_game_detail_page_state(command, (state) =>
    is_home
      ? { ...state, home_players: players }
      : { ...state, away_players: players },
  );
  return result.success;
}

function send_correction(
  command: LiveGameDetailEventHandlersCommand,
  fixture_id: string,
  request: LiveEventCorrectionRequest,
): ReturnType<
  LiveGameDetailEventHandlersCommand["action_dependencies"]["fixture_use_cases"]["remove_game_event"]
> {
  const fixtures = command.action_dependencies.fixture_use_cases;
  switch (request.kind) {
    case LIVE_EVENT_CORRECTION_KIND.EDIT:
      return fixtures.update_game_event(
        fixture_id,
        String(request.event.id),
        request.correction,
      );
    case LIVE_EVENT_CORRECTION_KIND.REMOVE:
      return fixtures.remove_game_event(fixture_id, String(request.event.id));
  }
}

export async function correct_live_game_detail_event(
  command: LiveGameDetailEventHandlersCommand,
  request: LiveEventCorrectionRequest,
): Promise<boolean> {
  const fixture = command.get_page_state().fixture;
  if (!fixture) return false;
  const result = await send_correction(command, String(fixture.id), request);
  if (!result.success) {
    show_live_game_detail_toast(
      command.set_toast_state,
      result.error,
      TOAST_KIND.ERROR,
    );
    return false;
  }
  update_live_game_detail_page_state(command, (state) => ({
    ...state,
    fixture: result.data,
  }));
  const is_removal = request.kind === LIVE_EVENT_CORRECTION_KIND.REMOVE;
  const lineup_restored =
    !is_removal ||
    (await restore_lineup_after_removed_substitution(command, request.event));
  show_live_game_detail_toast(
    command.set_toast_state,
    lineup_restored
      ? is_removal
        ? CORRECTION_MESSAGE.REMOVED
        : CORRECTION_MESSAGE.EDITED
      : CORRECTION_MESSAGE.LINEUP_NOT_RESTORED,
    lineup_restored ? TOAST_KIND.SUCCESS : TOAST_KIND.ERROR,
  );
  return true;
}
