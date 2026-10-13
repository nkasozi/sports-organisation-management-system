import { GLOBAL_ORGANIZATION_ID } from "./caller_scope";
import { read_string_or } from "./value_guards";

const EMPTY_SCOPE_VALUE = "";
const ENTITY_TYPE_SEPARATOR_PATTERN = /[\s_-]/g;
const NO_SEPARATOR = "";

const ScopedRole = {
  TEAM_MANAGER: "team_manager",
  OFFICIAL: "official",
  PLAYER: "player",
} as const;

const OFFICIAL_SELF_ENTITIES = new Set(["official", "officialprofile"]);
const PLAYER_SELF_ENTITIES = new Set(["player", "playerprofile"]);

interface ScopeFilterSubject {
  role: string;
  organization_id?: string;
  team_id?: string;
  player_id?: string;
  official_id?: string;
}

function get_scope_filter_value(value: unknown): string {
  return read_string_or(value, EMPTY_SCOPE_VALUE);
}

function normalize_entity_type(entity_type: string): string {
  return entity_type
    .toLowerCase()
    .replace(ENTITY_TYPE_SEPARATOR_PATTERN, NO_SEPARATOR);
}

function build_self_or_organization_filter(
  is_self_entity: boolean,
  self_id: unknown,
  organization_id: unknown,
): Record<string, string> {
  return is_self_entity
    ? { id: get_scope_filter_value(self_id) }
    : { organization_id: get_scope_filter_value(organization_id) };
}

export function build_user_scope_filter(
  user: ScopeFilterSubject,
  entity_type: string,
): Record<string, string> {
  if (user.organization_id === GLOBAL_ORGANIZATION_ID) return {};
  const normalized = normalize_entity_type(entity_type);
  switch (user.role) {
    case ScopedRole.TEAM_MANAGER:
      return {
        organization_id: get_scope_filter_value(user.organization_id),
        team_id: get_scope_filter_value(user.team_id),
      };
    case ScopedRole.OFFICIAL:
      return build_self_or_organization_filter(
        OFFICIAL_SELF_ENTITIES.has(normalized),
        user.official_id,
        user.organization_id,
      );
    case ScopedRole.PLAYER:
      return build_self_or_organization_filter(
        PLAYER_SELF_ENTITIES.has(normalized),
        user.player_id,
        user.organization_id,
      );
    default:
      return { organization_id: get_scope_filter_value(user.organization_id) };
  }
}
