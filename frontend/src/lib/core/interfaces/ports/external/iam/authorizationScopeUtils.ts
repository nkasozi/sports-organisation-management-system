import { ANY_VALUE } from "./AuthenticationPort";
import type { ScopeDimension, UserScopeProfile } from "./AuthorizationPort";

function has_unrestricted_scope(
  profile: UserScopeProfile | null,
  dimension: ScopeDimension,
): boolean {
  if (!profile) return false;
  const value = profile[dimension];
  return value === ANY_VALUE || value === undefined;
}

export function is_scope_restricted(
  profile: UserScopeProfile | null,
  dimension: ScopeDimension,
): boolean {
  return !has_unrestricted_scope(profile, dimension);
}

export function get_scope_value(
  profile: UserScopeProfile | null,
  dimension: ScopeDimension,
): string | null {
  if (!profile) return null;
  const value = profile[dimension];
  if (!value || value === ANY_VALUE) return null;
  return value;
}

export function get_authorization_restricted_fields(
  profile: UserScopeProfile | null,
): Set<string> {
  const restricted = new Set<string>();
  if (!profile) return restricted;
  if (is_scope_restricted(profile, "organization_id")) {
    restricted.add("organization_id");
  }
  if (is_scope_restricted(profile, "team_id")) {
    restricted.add("team_id");
  }
  if (is_scope_restricted(profile, "player_id")) {
    restricted.add("player_id");
  }
  return restricted;
}

export function get_authorization_preselect_values(
  profile: UserScopeProfile | null,
): Record<string, string> {
  const preselect_values: Record<string, string> = {};
  if (!profile) return preselect_values;
  const org_value = get_scope_value(profile, "organization_id");
  if (org_value) {
    preselect_values["organization_id"] = org_value;
  }
  const team_value = get_scope_value(profile, "team_id");
  if (team_value) {
    preselect_values["team_id"] = team_value;
  }
  const player_value = get_scope_value(profile, "player_id");
  if (player_value) {
    preselect_values["player_id"] = player_value;
  }
  return preselect_values;
}

export function build_authorization_list_filter(
  profile: UserScopeProfile | null,
  entity_fields: string[],
): Record<string, string> {
  const filter: Record<string, string> = {};
  if (!profile) return filter;
  const org_value = get_scope_value(profile, "organization_id");
  if (org_value && entity_fields.includes("organization_id")) {
    filter["organization_id"] = org_value;
  }
  const team_value = get_scope_value(profile, "team_id");
  if (team_value && entity_fields.includes("team_id")) {
    filter["team_id"] = team_value;
  }
  const player_value = get_scope_value(profile, "player_id");
  if (player_value && entity_fields.includes("player_id")) {
    filter["player_id"] = player_value;
  }
  return filter;
}

export function is_field_restricted_by_authorization(
  profile: UserScopeProfile | null,
  field_name: string,
): boolean {
  const restricted = get_authorization_restricted_fields(profile);
  return restricted.has(field_name);
}

function is_unrestricted_value(value: string | undefined | null): boolean {
  return value === ANY_VALUE || !value;
}

function is_restricted_value(value: string | undefined | null): boolean {
  return !is_unrestricted_value(value);
}
