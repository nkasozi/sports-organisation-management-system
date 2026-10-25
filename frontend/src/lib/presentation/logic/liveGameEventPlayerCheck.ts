import {
  create_failure_result,
  create_success_result,
  type Result,
} from "$lib/core/types/Result";

import { GAME_ACTION_USER_MESSAGE } from "./gameActionMessages";
import { validate_substitution } from "./liveGameOnFieldPlayers";

type SubstitutionCheck = Parameters<typeof validate_substitution>[0];

interface EventPlayerCheckCommand {
  selected_event_type: { requires_player?: boolean };
  selected_player_id: string;
  secondary_player_id: string;
  is_substitution_event: boolean;
  on_field_players: SubstitutionCheck["on_field_players"];
  max_players_on_field: SubstitutionCheck["max_players_on_field"];
  substitution_availability: SubstitutionCheck["availability"];
  substitution_rules: SubstitutionCheck["rules"];
}

export function check_event_players(
  command: EventPlayerCheckCommand,
): Result<boolean> {
  if (
    command.selected_event_type.requires_player &&
    !command.selected_player_id
  )
    return create_failure_result(GAME_ACTION_USER_MESSAGE.PLAYER_REQUIRED);
  if (!command.is_substitution_event) return create_success_result(true);
  return validate_substitution({
    on_field_players: command.on_field_players,
    player_on_id: command.selected_player_id,
    player_off_id: command.secondary_player_id,
    max_players_on_field: command.max_players_on_field,
    availability: command.substitution_availability,
    rules: command.substitution_rules,
  });
}
