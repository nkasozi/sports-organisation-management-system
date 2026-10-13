import type {
  BaseEntity,
  EntityMetadata,
  FieldMetadata,
} from "../../core/entities/BaseEntity";
import { WILDCARD_SCOPE } from "../../core/entities/StatusConstants";
import {
  build_authorization_list_filter,
  type UserScopeProfile,
} from "../../core/interfaces/ports";
import { PRESENCE_STATUS } from "./presenceStatus";

export type ListAuthorizationProfileState =
  | { status: typeof PRESENCE_STATUS.MISSING }
  | { status: typeof PRESENCE_STATUS.PRESENT; profile: UserScopeProfile };

export type ListAuthorizationMetadataState =
  | { status: typeof PRESENCE_STATUS.MISSING }
  | { status: typeof PRESENCE_STATUS.PRESENT; entity_metadata: EntityMetadata };

type EntityAuthorizationFilterState =
  | { status: typeof PRESENCE_STATUS.MISSING }
  | { status: typeof PRESENCE_STATUS.PRESENT; filter: Record<string, string> };

const ENTITY_AUTH_FILTER_STATUS = {
  PROFILE_MISSING: "profile_missing",
  READY: "ready",
} as const;

type EntityAuthFilterResult =
  | { status: typeof ENTITY_AUTH_FILTER_STATUS.PROFILE_MISSING }
  | {
      status: typeof ENTITY_AUTH_FILTER_STATUS.READY;
      filter_state: EntityAuthorizationFilterState;
    };

function normalize_entity_type_for_filter(type: string): string {
  return type.toLowerCase().replace(/[\s_-]/g, "");
}

type ScopedProfileField = "player_id" | "team_id" | "official_id";

type ScopedFilterRule = {
  normalized_type: string;
  profile_field: ScopedProfileField;
  filter_field: string;
};

const SCOPED_FILTER_RULES: ScopedFilterRule[] = [
  { normalized_type: "player", profile_field: "player_id", filter_field: "id" },
  {
    normalized_type: "player",
    profile_field: "team_id",
    filter_field: "team_id",
  },
  {
    normalized_type: "playerteammembership",
    profile_field: "player_id",
    filter_field: "player_id",
  },
  {
    normalized_type: "playerprofile",
    profile_field: "player_id",
    filter_field: "player_id",
  },
  {
    normalized_type: "fixture",
    profile_field: "team_id",
    filter_field: "team_id",
  },
  { normalized_type: "team", profile_field: "team_id", filter_field: "id" },
  {
    normalized_type: "teamprofile",
    profile_field: "team_id",
    filter_field: "team_id",
  },
  {
    normalized_type: "official",
    profile_field: "official_id",
    filter_field: "id",
  },
];

function apply_scoped_filter_rules(
  filter: Record<string, string>,
  auth_profile: UserScopeProfile,
  normalized_type: string,
): Record<string, string> {
  for (const rule of SCOPED_FILTER_RULES) {
    const scope_value = auth_profile[rule.profile_field];
    const has_valid_scope = scope_value && scope_value !== WILDCARD_SCOPE;
    if (rule.normalized_type === normalized_type && has_valid_scope)
      filter[rule.filter_field] = scope_value;
  }
  return filter;
}

export function build_entity_authorization_filter(
  profile_state: ListAuthorizationProfileState,
  metadata_state: ListAuthorizationMetadataState,
  entity_type: string,
): EntityAuthFilterResult {
  if (profile_state.status === PRESENCE_STATUS.MISSING) {
    return { status: ENTITY_AUTH_FILTER_STATUS.PROFILE_MISSING };
  }

  if (metadata_state.status === PRESENCE_STATUS.MISSING) {
    return {
      status: ENTITY_AUTH_FILTER_STATUS.READY,
      filter_state: { status: PRESENCE_STATUS.PRESENT, filter: {} },
    };
  }

  const auth_profile = profile_state.profile;
  const entity_fields = metadata_state.entity_metadata.fields.map(
    (f: FieldMetadata) => f.field_name,
  );
  const filter = apply_scoped_filter_rules(
    build_authorization_list_filter(auth_profile, entity_fields),
    auth_profile,
    normalize_entity_type_for_filter(entity_type),
  );

  return {
    status: ENTITY_AUTH_FILTER_STATUS.READY,
    filter_state: { status: PRESENCE_STATUS.PRESENT, filter },
  };
}

export function apply_id_filter_to_entities(
  entities: BaseEntity[],
  filter: Record<string, string> | undefined,
): BaseEntity[] {
  if (!filter || !filter.id) return entities;
  return entities.filter((entity) => entity.id === filter.id);
}

export function merge_entity_list_filters(
  sub_filter: Record<string, string> | undefined,
  auth_filter_state: EntityAuthorizationFilterState,
): Record<string, string> | undefined {
  if (auth_filter_state.status === PRESENCE_STATUS.MISSING) return;

  const auth_filter = auth_filter_state.filter;
  const has_sub = sub_filter && Object.keys(sub_filter).length > 0;
  const has_auth = Object.keys(auth_filter).length > 0;
  if (!has_sub && !has_auth) return;
  return { ...(sub_filter || {}), ...auth_filter };
}
