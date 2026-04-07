import type { GameEventType } from "../../core/entities/GameEventType";
import { get_default_game_event_types } from "../../core/entities/GameEventType";

export function create_default_game_event_types_for_organization(
  organization_id: string,
): GameEventType[] {
  const now = new Date().toISOString();
  const default_inputs = get_default_game_event_types(organization_id);
  return default_inputs.map((input, index) => ({
    id: `game_event_type_default_${index + 1}_${organization_id}`,
    created_at: now,
    updated_at: now,
    name: input.name,
    code: input.code,
    description: input.description,
    icon: input.icon,
    color: input.color,
    category: input.category,
    affects_score: input.affects_score,
    requires_player: input.requires_player,
    display_order: input.display_order,
    sport_id: input.sport_id,
    status: input.status,
    organization_id,
  }));
}
