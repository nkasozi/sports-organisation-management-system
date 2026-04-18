import type { BaseEntity } from "$lib/core/entities/BaseEntity";
import type { UserRole, UserScopeProfile } from "$lib/core/interfaces/ports";
import {
  build_authorization_list_filter,
  check_entity_permission,
  normalize_to_entity_type,
} from "$lib/core/interfaces/ports";

import {
  PROFILE_MANAGEMENT_ACTIONS,
  PROFILE_MANAGEMENT_PREVIEW_PATH_SEPARATOR,
  PROFILE_MANAGEMENT_STATUS_CLASS_BY_VALUE,
  PROFILE_MANAGEMENT_VISIBILITY_CLASS_BY_VALUE,
} from "./profileManagementPageConstants";

export type ProfileManagementViewMode = "list" | "create" | "edit";

export interface ProfileManagementEntity extends BaseEntity {
  profile_slug: string;
  visibility: string;
  status: string;
}

export interface ProfileManagementOption {
  value: string;
  label: string;
}

export interface ProfileManagementRow {
  id: string;
  entity: ProfileManagementEntity;
  subject_name: string;
  profile_slug: string;
  visibility: string;
  status: string;
}

export interface ProfileManagementPermissions {
  can_read: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export type ProfileManagementAuthorizationProfileState =
  | { status: "missing" }
  | { status: "present"; profile: UserScopeProfile };

export interface ProfileManagementProfileUseCases {
  list(filter?: Record<string, string>): Promise<{
    success: boolean;
    data?: { items?: ProfileManagementEntity[] };
    error?: string;
  }>;
  delete(id: string): Promise<{ success: boolean; error?: string }>;
}

export interface ProfileManagementRelatedEntityUseCases {
  list(filter?: Record<string, string>): Promise<{
    success: boolean;
    data?: { items?: BaseEntity[] };
    error?: string;
  }>;
}

export interface ProfileManagementConfiguration {
  page_head_title: string;
  entity_type: string;
  normalized_entity_type: string;
  subject_column_label: string;
  list_title: string;
  create_title: string;
  edit_title: string;
  empty_title: string;
  empty_message: string;
  create_button_label: string;
  back_button_label: string;
  preview_button_label: string;
  preview_panel_label: string;
  preview_panel_action_label: string;
  show_edit_preview: boolean;
  access_denial_path: string;
  access_denial_message: string;
  create_denied_message: string;
  edit_denied_message: string;
  delete_denied_message: string;
  delete_confirmation_message: string;
  authorization_filter_fields: string[];
  profile_use_cases: ProfileManagementProfileUseCases;
  related_entity_use_cases: ProfileManagementRelatedEntityUseCases;
  get_related_entity_label: (entity: BaseEntity) => string;
  get_profile_related_entity_id: (profile: ProfileManagementEntity) => string;
  get_profile_preview_path: (profile: ProfileManagementEntity) => string;
}

export function build_profile_management_authorization_filter(
  profile_state: ProfileManagementAuthorizationProfileState,
  authorization_filter_fields: string[],
): Record<string, string> {
  if (profile_state.status !== "present") {
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
