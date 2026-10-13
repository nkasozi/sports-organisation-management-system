import type { GameEventType } from "../../core/entities/GameEventType";
import type { GameEventTypeFilter } from "../../core/interfaces/ports";
import {
  apply_entity_filter_rules,
  type EntityFilterRule,
  equals_rule,
  FILTER_RULE_ACTIVATION,
  predicate_rule,
  text_contains_rule,
} from "./InBrowserRepositoryFilterRules";

const GLOBAL_GAME_EVENT_TYPE_SPORT_ID = "" as GameEventType["sport_id"];

const GAME_EVENT_TYPE_FILTER_RULES: EntityFilterRule<
  GameEventType,
  GameEventTypeFilter
>[] = [
  text_contains_rule("name_contains", (entity) => entity.name),
  equals_rule("code"),
  predicate_rule(
    "sport_id",
    (entity, filter) =>
      entity.sport_id === filter.sport_id ||
      entity.sport_id === GLOBAL_GAME_EVENT_TYPE_SPORT_ID,
    FILTER_RULE_ACTIVATION.WHEN_KEY_PRESENT,
  ),
  equals_rule("category"),
  equals_rule("affects_score", FILTER_RULE_ACTIVATION.WHEN_KEY_PRESENT),
  equals_rule("requires_player", FILTER_RULE_ACTIVATION.WHEN_KEY_PRESENT),
  equals_rule("status"),
  equals_rule("organization_id"),
];

export function apply_game_event_type_filter(
  entities: GameEventType[],
  filter: GameEventTypeFilter,
): GameEventType[] {
  return apply_entity_filter_rules(
    entities,
    filter,
    GAME_EVENT_TYPE_FILTER_RULES,
  );
}

export function sort_game_event_types(
  entities: GameEventType[],
): GameEventType[] {
  return [...entities].sort(
    (first_entity: GameEventType, second_entity: GameEventType) =>
      first_entity.display_order - second_entity.display_order,
  );
}
