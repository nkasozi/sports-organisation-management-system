export {
  type EventCategory,
  type GameEventType,
  type CreateGameEventTypeInput,
  type UpdateGameEventTypeInput,
  create_empty_game_event_type_input,
  EVENT_CATEGORY_OPTIONS,
  get_category_label,
  validate_game_event_type_input,
} from "./GameEventTypeTypes";

export { get_scoring_and_discipline_event_types } from "./GameEventTypeScoringDefaults";
export { get_play_and_control_event_types } from "./GameEventTypePlayDefaults";

import { get_scoring_and_discipline_event_types } from "./GameEventTypeScoringDefaults";
import { get_play_and_control_event_types } from "./GameEventTypePlayDefaults";
import type { CreateGameEventTypeInput } from "./GameEventTypeTypes";

export function get_default_game_event_types(
  organization_id: string,
): CreateGameEventTypeInput[] {
  return [
    ...get_scoring_and_discipline_event_types(organization_id),
    ...get_play_and_control_event_types(organization_id),
  ];
}
