import {
  create_none_option,
  create_some_option,
  type Option,
} from "$lib/core/types/Option";
import type {
  ProfileManagementEntity,
  ProfileManagementViewMode,
} from "$lib/presentation/logic/profileManagementPageState";

export const PROFILE_MANAGEMENT_VIEW = {
  LIST: "list",
  CREATE: "create",
  EDIT: "edit",
} as const satisfies Record<string, ProfileManagementViewMode>;

export const PROFILE_MANAGEMENT_LOAD_STATUS = {
  LOADING: "loading",
  FAILED: "failed",
  READY: "ready",
} as const;

export type ProfileManagementEditorState =
  | { view: typeof PROFILE_MANAGEMENT_VIEW.LIST }
  | { view: typeof PROFILE_MANAGEMENT_VIEW.CREATE }
  | {
      view: typeof PROFILE_MANAGEMENT_VIEW.EDIT;
      profile: ProfileManagementEntity;
    };

export type ProfileManagementLoadState =
  | { status: typeof PROFILE_MANAGEMENT_LOAD_STATUS.LOADING }
  | { status: typeof PROFILE_MANAGEMENT_LOAD_STATUS.FAILED; message: string }
  | { status: typeof PROFILE_MANAGEMENT_LOAD_STATUS.READY };

export function create_profile_management_list_state(): ProfileManagementEditorState {
  return { view: PROFILE_MANAGEMENT_VIEW.LIST };
}

export function create_profile_management_create_state(): ProfileManagementEditorState {
  return { view: PROFILE_MANAGEMENT_VIEW.CREATE };
}

export function create_profile_management_edit_state(
  profile: ProfileManagementEntity,
): ProfileManagementEditorState {
  return { view: PROFILE_MANAGEMENT_VIEW.EDIT, profile };
}

export function get_profile_management_editor_entity(
  editor_state: ProfileManagementEditorState,
): Option<ProfileManagementEntity> {
  switch (editor_state.view) {
    case PROFILE_MANAGEMENT_VIEW.EDIT:
      return create_some_option(editor_state.profile);
    case PROFILE_MANAGEMENT_VIEW.CREATE:
    case PROFILE_MANAGEMENT_VIEW.LIST:
      return create_none_option();
  }
}

export function get_profile_management_list_notice(
  load_state: ProfileManagementLoadState,
  action_notice: string,
): string {
  switch (load_state.status) {
    case PROFILE_MANAGEMENT_LOAD_STATUS.FAILED:
      return load_state.message;
    case PROFILE_MANAGEMENT_LOAD_STATUS.LOADING:
    case PROFILE_MANAGEMENT_LOAD_STATUS.READY:
      return action_notice;
  }
}
