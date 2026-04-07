export { get_play_and_control_event_types } from "./GameEventTypePlayDefaults";
export { get_scoring_and_discipline_event_types } from "./GameEventTypeScoringDefaults";
export {
  create_empty_game_event_type_input,
  type CreateGameEventTypeInput,
  EVENT_CATEGORY_OPTIONS,
  type EventCategory,
  type GameEventType,
  get_category_label,
  type UpdateGameEventTypeInput,
  validate_game_event_type_input,
} from "./GameEventTypeTypes";

import { get_play_and_control_event_types } from "./GameEventTypePlayDefaults";
import { get_scoring_and_discipline_event_types } from "./GameEventTypeScoringDefaults";
import type { CreateGameEventTypeInput } from "./GameEventTypeTypes";

export function get_default_game_event_types(
  organization_id: string,
): CreateGameEventTypeInput[] {
  return [
    ...get_scoring_and_discipline_event_types(organization_id),
    ...get_play_and_control_event_types(organization_id),
  ];
}
