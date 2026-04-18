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

export type ListAuthorizationProfileState =
  | { status: "missing" }
  | { status: "present"; profile: UserScopeProfile };

export type ListAuthorizationMetadataState =
  | { status: "missing" }
  | { status: "present"; entity_metadata: EntityMetadata };

type EntityAuthorizationFilterState =
  | { status: "missing" }
  | { status: "present"; filter: Record<string, string> };

type EntityAuthFilterResult =
  | { status: "profile_missing" }
  | { status: "ready"; filter_state: EntityAuthorizationFilterState };

function normalize_entity_type_for_filter(type: string): string {
  return type.toLowerCase().replace(/[\s_-]/g, "");
}

export function build_entity_authorization_filter(
  profile_state: ListAuthorizationProfileState,
  metadata_state: ListAuthorizationMetadataState,
  entity_type: string,
): EntityAuthFilterResult {
  if (profile_state.status === "missing") {
    return { status: "profile_missing" };
  }

  if (metadata_state.status === "missing") {
    return {
      status: "ready",
      filter_state: { status: "present", filter: {} },
    };
  }

  const auth_profile = profile_state.profile;
  const entity_metadata = metadata_state.entity_metadata;

  const entity_fields = entity_metadata.fields.map(
    (f: FieldMetadata) => f.field_name,
  );
  const filter = build_authorization_list_filter(auth_profile, entity_fields);
  const normalized_type = normalize_entity_type_for_filter(entity_type);
  const player_id = auth_profile.player_id;
  const team_id = auth_profile.team_id;
  const has_valid_player_id = player_id && player_id !== WILDCARD_SCOPE;
  const has_valid_team_id = team_id && team_id !== WILDCARD_SCOPE;

  if (normalized_type === "player" && has_valid_player_id)
    filter["id"] = player_id;
  if (normalized_type === "player" && has_valid_team_id)
    filter["team_id"] = team_id;
  if (normalized_type === "playerteammembership" && has_valid_player_id)
    filter["player_id"] = player_id;
  if (normalized_type === "playerprofile" && has_valid_player_id)
    filter["player_id"] = player_id;
  if (normalized_type === "fixture" && has_valid_team_id)
    filter["team_id"] = team_id;
  if (normalized_type === "team" && has_valid_team_id) filter["id"] = team_id;
  if (normalized_type === "teamprofile" && has_valid_team_id)
    filter["team_id"] = team_id;

  const official_id = auth_profile.official_id;
  const has_valid_official_id = official_id && official_id !== WILDCARD_SCOPE;
  if (normalized_type === "official" && has_valid_official_id)
    filter["id"] = official_id;

  return {
    status: "ready",
    filter_state: { status: "present", filter },
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
  if (auth_filter_state.status === "missing") return;

  const auth_filter = auth_filter_state.filter;
  const has_sub = sub_filter && Object.keys(sub_filter).length > 0;
  const has_auth = Object.keys(auth_filter).length > 0;
  if (!has_sub && !has_auth) return;
  return { ...(sub_filter || {}), ...auth_filter };
}
