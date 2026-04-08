import type { GameEventType } from "../../core/entities/GameEventType";
import type { GameEventTypeFilter } from "../../core/interfaces/ports";

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
  if (filter.sport_id !== undefined) {
    filtered = filtered.filter(
      (entity: GameEventType) =>
        entity.sport_id === filter.sport_id || entity.sport_id === null,
    );
  }
  if (filter.category) {
    filtered = filtered.filter(
      (entity: GameEventType) => entity.category === filter.category,
    );
  }
  if (filter.affects_score !== undefined) {
    filtered = filtered.filter(
      (entity: GameEventType) => entity.affects_score === filter.affects_score,
    );
  }
  if (filter.requires_player !== undefined) {
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
