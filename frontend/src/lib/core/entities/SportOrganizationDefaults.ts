import type { CreateGameEventTypeInput } from "./GameEventTypeTypes";
import { EVENT_CATEGORY } from "./GameEventTypeTypes";
import type { CreateGameOfficialRoleInput } from "./GameOfficialRole";
import type { CreatePlayerPositionInput } from "./PlayerPosition";
import type { Sport } from "./Sport";
import {
  build_sport_event_buttons,
  get_known_event_label,
  normalize_sport_code,
} from "./SportEventCatalog";
import { resolve_sport_event_source } from "./SportEventSource";
import {
  GENERAL_PLAYER_POSITION,
  SPORT_PLAYER_POSITION_PRESETS,
} from "./SportPlayerPositionPresets";
import { ENTITY_STATUS } from "./StatusConstants";

type OrganizationId = CreateGameOfficialRoleInput["organization_id"];

const FIRST_DISPLAY_ORDER = 1;

function to_role_code(role_id: string): string {
  return role_id
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

export function build_sport_official_roles(
  sport: Sport,
  organization_id: OrganizationId,
): CreateGameOfficialRoleInput[] {
  return sport.official_requirements.map((requirement, index) => ({
    name: requirement.role_name,
    code: to_role_code(requirement.role_id),
    description: requirement.description,
    sport_id: sport.id,
    is_on_field: requirement.is_mandatory,
    is_head_official: index === 0,
    display_order: index + FIRST_DISPLAY_ORDER,
    status: ENTITY_STATUS.ACTIVE,
    organization_id,
  }));
}

function resolve_event_category(
  affects_score: boolean,
  is_card: boolean,
): CreateGameEventTypeInput["category"] {
  if (affects_score) return EVENT_CATEGORY.SCORE;
  return is_card ? EVENT_CATEGORY.DISCIPLINE : EVENT_CATEGORY.PLAY;
}

export function build_sport_event_types(
  sport: Sport,
  organization_id: OrganizationId,
): CreateGameEventTypeInput[] {
  const source = resolve_sport_event_source(sport, void 0);
  const card_ids = new Set(source.card_types.map((card) => card.id));
  return build_sport_event_buttons(source).map((button, index) => ({
    name: get_known_event_label(button.id),
    code: button.id,
    description: get_known_event_label(button.id),
    icon: button.icon,
    color: button.color,
    category: resolve_event_category(
      button.affects_score,
      card_ids.has(button.id),
    ),
    affects_score: button.affects_score,
    requires_player: button.requires_player,
    display_order: index + FIRST_DISPLAY_ORDER,
    sport_id: sport.id,
    status: ENTITY_STATUS.ACTIVE,
    organization_id,
  }));
}

export function build_sport_player_positions(
  sport: Sport,
  organization_id: OrganizationId,
): CreatePlayerPositionInput[] {
  const presets = SPORT_PLAYER_POSITION_PRESETS[
    normalize_sport_code(sport.code)
  ] ?? [GENERAL_PLAYER_POSITION];
  return presets.map((preset, index) => ({
    ...preset,
    sport_type: sport.name,
    display_order: index + FIRST_DISPLAY_ORDER,
    is_available: true,
    status: ENTITY_STATUS.ACTIVE,
    organization_id,
  }));
}
