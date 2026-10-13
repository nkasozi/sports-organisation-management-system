import {
  get_authorization_preselect_values,
  get_authorization_restricted_fields,
} from "$lib/core/interfaces/ports";
import type { SubEntityFilter } from "$lib/core/types/SubEntityFilter";

import type {
  BaseEntity,
  EntityMetadata,
  FieldMetadata,
} from "../../core/entities/BaseEntity";
import type { AuthProfileState } from "../stores/authTypes";
import { build_dynamic_entity_form_auth_profile_state } from "./dynamicEntityFormComponentSetup";
import { get_dynamic_form_sorted_fields_for_display } from "./dynamicEntityFormFieldState";
import { create_dynamic_form_initialization_key } from "./dynamicEntityFormInitialization";
import type { DynamicFormData } from "./dynamicFormConstants";
import { PRESENCE_STATUS } from "./presenceStatus";
import {
  build_user_role_state,
  type UserRoleState,
} from "./systemUserFormLogic";

export function build_dynamic_entity_form_role_state(
  current_profile: AuthProfileState,
): UserRoleState {
  return current_profile.status === PRESENCE_STATUS.PRESENT
    ? build_user_role_state(current_profile.profile.role)
    : build_user_role_state();
}

export function build_dynamic_entity_form_sorted_fields(
  entity_metadata: EntityMetadata | undefined,
  is_edit_mode: boolean,
  form_data: DynamicFormData,
  sub_entity_filter: SubEntityFilter | undefined,
): FieldMetadata[] {
  return entity_metadata
    ? get_dynamic_form_sorted_fields_for_display(
        entity_metadata.fields,
        is_edit_mode,
        form_data,
        sub_entity_filter as never,
      )
    : [];
}

export function build_dynamic_entity_form_initialization_key(
  entity_type: string,
  entity_metadata: EntityMetadata | undefined,
  entity_data: Partial<BaseEntity> | undefined,
  authorization_preselect: Record<string, string>,
): string {
  return entity_metadata
    ? create_dynamic_form_initialization_key({
        entity_type,
        metadata: entity_metadata,
        existing_data: entity_data as never,
        authorization_preselect,
      })
    : "";
}

interface DynamicEntityFormAuthDerivations {
  role_state: UserRoleState;
  restricted_fields: Set<string>;
  preselect_values: Record<string, string>;
}

export function build_dynamic_entity_form_auth_derivations(
  current_profile: AuthProfileState,
): DynamicEntityFormAuthDerivations {
  const profile_state =
    build_dynamic_entity_form_auth_profile_state(current_profile);
  return {
    role_state: build_dynamic_entity_form_role_state(current_profile),
    restricted_fields: get_authorization_restricted_fields(profile_state),
    preselect_values: get_authorization_preselect_values(profile_state),
  };
}
