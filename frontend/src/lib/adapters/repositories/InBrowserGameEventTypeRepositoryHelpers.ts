import type { GameEventType } from "../../core/entities/GameEventType";
import type { GameEventTypeFilter } from "../../core/interfaces/ports";

const GLOBAL_GAME_EVENT_TYPE_SPORT_ID = "" as GameEventType["sport_id"];

export function apply_game_event_type_filter(
  entities: GameEventType[],
  filter: GameEventTypeFilter,
): GameEventType[] {
  let filtered = entities;
  if (filter.name_contains) {
    const term = filter.name_contains.toLowerCase();
    filtered = filtered.filter((entity: GameEventType) =>
      entity.name.toLowerCase().includes(term),
    );
  }
  if (filter.code) {
    filtered = filtered.filter(
      (entity: GameEventType) => entity.code === filter.code,
    );
  }
  if ("sport_id" in filter) {
    filtered = filtered.filter(
      (entity: GameEventType) =>
        entity.sport_id === filter.sport_id ||
        entity.sport_id === GLOBAL_GAME_EVENT_TYPE_SPORT_ID,
    );
  }
  if (filter.category) {
    filtered = filtered.filter(
      (entity: GameEventType) => entity.category === filter.category,
    );
  }
  if ("affects_score" in filter) {
    filtered = filtered.filter(
      (entity: GameEventType) => entity.affects_score === filter.affects_score,
    );
  }
  if ("requires_player" in filter) {
    filtered = filtered.filter(
      (entity: GameEventType) =>
        entity.requires_player === filter.requires_player,
    );
  }
  if (filter.status) {
    filtered = filtered.filter(
      (entity: GameEventType) => entity.status === filter.status,
    );
  }
  if (filter.organization_id) {
    filtered = filtered.filter(
      (entity: GameEventType) =>
        entity.organization_id === filter.organization_id,
    );
  }
  return filtered;
}

export function sort_game_event_types(
  entities: GameEventType[],
): GameEventType[] {
  return [...entities].sort(
    (first_entity: GameEventType, second_entity: GameEventType) =>
      first_entity.display_order - second_entity.display_order,
  );
}
