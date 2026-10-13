import type { BaseEntity } from "$lib/core/entities/BaseEntity";
import type { UserScopeProfile } from "$lib/core/interfaces/ports";

import type { PRESENCE_STATUS } from "./presenceStatus";

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
  | { status: typeof PRESENCE_STATUS.MISSING }
  | { status: typeof PRESENCE_STATUS.PRESENT; profile: UserScopeProfile };

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
