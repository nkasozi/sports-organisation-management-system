import { ANY_VALUE } from "./AuthenticationPort";
import type { ScopeDimension, UserScopeProfile } from "./AuthorizationPort";

type AuthorizationScopeProfileState =
  | { status: "missing" }
  | { status: "present"; profile: UserScopeProfile };

type AuthorizationScopeProfileInput =
  | AuthorizationScopeProfileState
  | UserScopeProfile;

function build_scope_profile_state(
  profile: AuthorizationScopeProfileInput,
): AuthorizationScopeProfileState {
  if ("status" in profile) {
    return profile;
  }

  return { status: "present", profile };
}

function has_unrestricted_scope(
  profile: AuthorizationScopeProfileInput,
  dimension: ScopeDimension,
): boolean {
  const profile_state = build_scope_profile_state(profile);

  if (profile_state.status !== "present") {
    return true;
  }

  return is_unrestricted_value(profile_state.profile[dimension]);
}

export function is_scope_restricted(
  profile: AuthorizationScopeProfileInput,
  dimension: ScopeDimension,
): boolean {
  return !has_unrestricted_scope(profile, dimension);
}

export function get_scope_value(
  profile: AuthorizationScopeProfileInput,
  dimension: ScopeDimension,
): string {
  const profile_state = build_scope_profile_state(profile);

  if (profile_state.status !== "present") {
    return "";
  }

  const value = profile_state.profile[dimension];

  if (is_unrestricted_value(value)) {
    return "";
  }

  return value ?? "";
}

export function get_authorization_restricted_fields(
  profile: AuthorizationScopeProfileInput,
): Set<string> {
  const restricted = new Set<string>();

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
  profile: AuthorizationScopeProfileInput,
): Record<string, string> {
  const preselect_values: Record<string, string> = {};
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
  profile: AuthorizationScopeProfileInput,
  entity_fields: string[],
): Record<string, string> {
  const filter: Record<string, string> = {};
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
  profile: AuthorizationScopeProfileInput,
  field_name: string,
): boolean {
  const restricted = get_authorization_restricted_fields(profile);
  return restricted.has(field_name);
}

function is_unrestricted_value(value: string | undefined): boolean {
  return value === ANY_VALUE || !value;
}
