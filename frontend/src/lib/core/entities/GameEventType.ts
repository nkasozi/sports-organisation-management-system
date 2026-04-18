import { get_play_and_control_event_types } from "./GameEventTypePlayDefaults";
import { get_scoring_and_discipline_event_types } from "./GameEventTypeScoringDefaults";
import type { CreateGameEventTypeInput } from "./GameEventTypeTypes";

export {
  type CreateGameEventTypeInput,
  type EventCategory,
  type GameEventType,
  type UpdateGameEventTypeInput,
} from "./GameEventTypeTypes";

export function get_default_game_event_types(
  organization_id: CreateGameEventTypeInput["organization_id"],
): CreateGameEventTypeInput[] {
  return [
    ...get_scoring_and_discipline_event_types(organization_id),
    ...get_play_and_control_event_types(organization_id),
  ];
}
