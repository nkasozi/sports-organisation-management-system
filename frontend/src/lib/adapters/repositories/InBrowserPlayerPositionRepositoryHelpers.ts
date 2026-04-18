import type { PlayerPosition } from "../../core/entities/PlayerPosition";
import type { PlayerPositionFilter } from "../../core/entities/PlayerPosition";

export function apply_player_position_filter(
  entities: PlayerPosition[],
  filter: PlayerPositionFilter,
): PlayerPosition[] {
  let filtered = entities;
  if (filter.name_contains) {
    const term = filter.name_contains.toLowerCase();
    filtered = filtered.filter((entity: PlayerPosition) =>
      entity.name.toLowerCase().includes(term),
    );
  }
  if (filter.category) {
    filtered = filtered.filter(
      (entity: PlayerPosition) => entity.category === filter.category,
    );
  }
  if (filter.sport_type) {
    filtered = filtered.filter(
      (entity: PlayerPosition) => entity.sport_type === filter.sport_type,
    );
  }
  if ("is_available" in filter) {
    filtered = filtered.filter(
      (entity: PlayerPosition) => entity.is_available === filter.is_available,
    );
  }
  if (filter.status) {
    filtered = filtered.filter(
      (entity: PlayerPosition) => entity.status === filter.status,
    );
  }
  if (filter.organization_id) {
    filtered = filtered.filter(
      (entity: PlayerPosition) =>
        entity.organization_id === filter.organization_id,
    );
  }
  return filtered;
}

export function sort_player_positions(
  entities: PlayerPosition[],
): PlayerPosition[] {
  return [...entities].sort(
    (first_entity: PlayerPosition, second_entity: PlayerPosition) =>
      first_entity.display_order - second_entity.display_order,
  );
}
