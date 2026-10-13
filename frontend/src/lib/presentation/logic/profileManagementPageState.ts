import type { BaseEntity } from "$lib/core/entities/BaseEntity";
import type { UserRole } from "$lib/core/interfaces/ports";
import {
  build_authorization_list_filter,
  check_entity_permission,
  normalize_to_entity_type,
} from "$lib/core/interfaces/ports";

import { PRESENCE_STATUS } from "./presenceStatus";
import {
  PROFILE_MANAGEMENT_ACTIONS,
  PROFILE_MANAGEMENT_PREVIEW_PATH_SEPARATOR,
  PROFILE_MANAGEMENT_STATUS_CLASS_BY_VALUE,
  PROFILE_MANAGEMENT_VISIBILITY_CLASS_BY_VALUE,
} from "./profileManagementPageConstants";
import type {
  ProfileManagementAuthorizationProfileState,
  ProfileManagementEntity,
  ProfileManagementOption,
  ProfileManagementPermissions,
  ProfileManagementRow,
} from "./profileManagementPageTypes";

export type {
  ProfileManagementAuthorizationProfileState,
  ProfileManagementConfiguration,
  ProfileManagementEntity,
  ProfileManagementOption,
  ProfileManagementPermissions,
  ProfileManagementRow,
  ProfileManagementViewMode,
} from "./profileManagementPageTypes";

export function build_profile_management_authorization_filter(
  profile_state: ProfileManagementAuthorizationProfileState,
  authorization_filter_fields: string[],
): Record<string, string> {
  if (profile_state.status !== PRESENCE_STATUS.PRESENT) {
    return {};
  }

  return build_authorization_list_filter(
    profile_state.profile,
    authorization_filter_fields,
  );
}

export function build_profile_management_permissions(
  role: UserRole | undefined,
  entity_type: string,
): ProfileManagementPermissions {
  if (!role)
    return {
      can_read: false,
      can_create: false,
      can_edit: false,
      can_delete: false,
    };
  const normalized_entity_type = normalize_to_entity_type(entity_type);
  return {
    can_read: check_entity_permission(
      role,
      normalized_entity_type,
      PROFILE_MANAGEMENT_ACTIONS.READ,
    ),
    can_create: check_entity_permission(
      role,
      normalized_entity_type,
      PROFILE_MANAGEMENT_ACTIONS.CREATE,
    ),
    can_edit: check_entity_permission(
      role,
      normalized_entity_type,
      PROFILE_MANAGEMENT_ACTIONS.UPDATE,
    ),
    can_delete: check_entity_permission(
      role,
      normalized_entity_type,
      PROFILE_MANAGEMENT_ACTIONS.DELETE,
    ),
  };
}

export function build_profile_management_options<TEntity extends BaseEntity>(
  entities: TEntity[],
  get_label: (entity: TEntity) => string,
): ProfileManagementOption[] {
  return entities.map((entity: TEntity) => ({
    value: entity.id,
    label: get_label(entity),
  }));
}

export function build_profile_management_rows(
  profiles: ProfileManagementEntity[],
  related_entity_options: ProfileManagementOption[],
  get_related_entity_id: (profile: ProfileManagementEntity) => string,
): ProfileManagementRow[] {
  const related_entity_label_by_id = new Map(
    related_entity_options.map((option: ProfileManagementOption) => [
      option.value,
      option.label,
    ]),
  );
  return profiles.map((profile: ProfileManagementEntity) => {
    const related_entity_id = get_related_entity_id(profile);
    return {
      id: profile.id,
      entity: profile,
      subject_name:
        related_entity_label_by_id.get(related_entity_id) || related_entity_id,
      profile_slug: profile.profile_slug,
      visibility: profile.visibility,
      status: profile.status,
    };
  });
}

export function get_profile_management_visibility_badge_class(
  visibility: string,
): string {
  return (
    PROFILE_MANAGEMENT_VISIBILITY_CLASS_BY_VALUE[visibility] ||
    PROFILE_MANAGEMENT_VISIBILITY_CLASS_BY_VALUE.private
  );
}

export function get_profile_management_status_badge_class(
  status: string,
): string {
  return (
    PROFILE_MANAGEMENT_STATUS_CLASS_BY_VALUE[status] ||
    PROFILE_MANAGEMENT_STATUS_CLASS_BY_VALUE.inactive
  );
}

export function build_profile_management_preview_path(
  path_prefix: string,
  profile_slug: string,
): string {
  if (!profile_slug.trim()) return "";
  return `${path_prefix}${PROFILE_MANAGEMENT_PREVIEW_PATH_SEPARATOR}${profile_slug}`;
}
