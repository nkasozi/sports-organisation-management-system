import { ANY_VALUE } from "./AuthenticationPort";
import type { ScopeDimension, UserScopeProfile } from "./AuthorizationPort";

const AUTHORIZATION_SCOPE_PROFILE_STATUS = {
  MISSING: "missing",
  PRESENT: "present",
} as const;

type AuthorizationScopeProfileState =
  | { status: typeof AUTHORIZATION_SCOPE_PROFILE_STATUS.MISSING }
  | {
      status: typeof AUTHORIZATION_SCOPE_PROFILE_STATUS.PRESENT;
      profile: UserScopeProfile;
    };

type AuthorizationScopeProfileInput =
  | AuthorizationScopeProfileState
  | UserScopeProfile;

const FILTERABLE_SCOPE_DIMENSIONS: readonly ScopeDimension[] = [
  "organization_id",
  "team_id",
  "player_id",
];

function build_scope_profile_state(
  profile: AuthorizationScopeProfileInput,
): AuthorizationScopeProfileState {
  if ("status" in profile) {
    return profile;
  }

  return { status: AUTHORIZATION_SCOPE_PROFILE_STATUS.PRESENT, profile };
}

function read_restricted_scope_value(
  profile: AuthorizationScopeProfileInput,
  dimension: ScopeDimension,
): string {
  const profile_state = build_scope_profile_state(profile);

  switch (profile_state.status) {
    case AUTHORIZATION_SCOPE_PROFILE_STATUS.MISSING:
      return "";
    case AUTHORIZATION_SCOPE_PROFILE_STATUS.PRESENT: {
      const value = profile_state.profile[dimension];
      return is_unrestricted_value(value) ? "" : (value ?? "");
    }
  }
}

export function is_scope_restricted(
  profile: AuthorizationScopeProfileInput,
  dimension: ScopeDimension,
): boolean {
  return read_restricted_scope_value(profile, dimension).length > 0;
}

export function get_scope_value(
  profile: AuthorizationScopeProfileInput,
  dimension: ScopeDimension,
): string {
  return read_restricted_scope_value(profile, dimension);
}

export function get_authorization_restricted_fields(
  profile: AuthorizationScopeProfileInput,
): Set<string> {
  return new Set<string>(
    FILTERABLE_SCOPE_DIMENSIONS.filter((dimension) =>
      is_scope_restricted(profile, dimension),
    ),
  );
}

function build_scope_value_map(
  profile: AuthorizationScopeProfileInput,
  dimensions: readonly ScopeDimension[],
): Record<string, string> {
  const values: Record<string, string> = {};
  for (const dimension of dimensions) {
    const value = get_scope_value(profile, dimension);
    if (value) values[dimension] = value;
  }
  return values;
}

export function get_authorization_preselect_values(
  profile: AuthorizationScopeProfileInput,
): Record<string, string> {
  return build_scope_value_map(profile, FILTERABLE_SCOPE_DIMENSIONS);
}

export function build_authorization_list_filter(
  profile: AuthorizationScopeProfileInput,
  entity_fields: string[],
): Record<string, string> {
  return build_scope_value_map(
    profile,
    FILTERABLE_SCOPE_DIMENSIONS.filter((dimension) =>
      entity_fields.includes(dimension),
    ),
  );
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
