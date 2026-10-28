import type { QuickEventButton } from "$lib/core/entities/Fixture";
import type { PlayerTimeOnStatus } from "$lib/core/entities/FixtureLineup";

import {
  record_live_game_detail_event,
  update_live_game_detail_player_time_on,
} from "./liveGameDetailControllerEventRecording";
import {
  type LiveGameDetailEventHandlersCommand,
  open_live_game_detail_event_modal,
  select_live_game_detail_event_player,
  select_live_game_detail_secondary_player,
} from "./liveGameDetailControllerEventSelection";
import {
  correct_live_game_detail_event,
  type LiveEventCorrectionRequest,
  reset_live_game_event_edits,
} from "./liveGameEventCorrection";

export function create_live_game_detail_event_handlers(
  command: LiveGameDetailEventHandlersCommand,
): {
  open_event_modal: (
    event_button: QuickEventButton,
    team_side: "home" | "away",
  ) => void;
  record_event: () => Promise<void>;
  correct_event: (request: LiveEventCorrectionRequest) => Promise<boolean>;
  reset_event_edits: () => Promise<boolean>;
  select_event_player: (player_id: string) => void;
  select_secondary_player: (player_id: string) => void;
  update_player_time_on: (
    team_side: "home" | "away",
    player_id: string,
    new_time_on: PlayerTimeOnStatus,
  ) => Promise<boolean>;
} {
  return {
    open_event_modal: (event_button, team_side): void =>
      open_live_game_detail_event_modal(command, event_button, team_side),
    select_event_player: (player_id): void =>
      select_live_game_detail_event_player(command, player_id),
    select_secondary_player: (player_id): void =>
      select_live_game_detail_secondary_player(command, player_id),
    update_player_time_on: (team_side, player_id, new_time_on) =>
      update_live_game_detail_player_time_on(
        command,
        team_side,
        player_id,
        new_time_on,
      ),
    record_event: () => record_live_game_detail_event(command),
    correct_event: (request) =>
      correct_live_game_detail_event(command, request),
    reset_event_edits: () => reset_live_game_event_edits(command),
  };
}
