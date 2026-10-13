import type { DataAction } from "$lib/core/interfaces/ports";
import {
  build_record_owners_for_player,
  get_entity_level_disabled_operations,
  is_entity_action_permitted_for_record,
  normalize_to_entity_type,
} from "$lib/core/interfaces/ports";
import type { CrudFunctionality } from "$lib/core/types/EntityHandlers";
import type { SubEntityFilter } from "$lib/core/types/SubEntityFilter";

import type { AuthProfileState, UserProfile } from "../stores/authTypes";
import { PRESENCE_STATUS } from "./presenceStatus";

const SUB_ENTITY_CRUD_ACTIONS: ReadonlyArray<{
  functionality: CrudFunctionality;
  action: DataAction;
}> = [
  { functionality: "create", action: "create" },
  { functionality: "edit", action: "update" },
  { functionality: "delete", action: "delete" },
];

const ALL_SUB_ENTITY_FUNCTIONALITIES: CrudFunctionality[] =
  SUB_ENTITY_CRUD_ACTIONS.map((entry) => entry.functionality);
const NO_LINKED_PLAYER_ID = "";
const SUB_ENTITY_PERMISSION_EVENT = "sub_entity_permission_checked";
const SUB_ENTITY_PERMISSION_LOG_SCOPE = "[SubEntityPermissions]";

function build_parent_scoped_record(
  sub_filter: SubEntityFilter,
): Record<string, unknown> {
  const scoped_record: Record<string, unknown> = {
    [sub_filter.foreign_key_field]: sub_filter.foreign_key_value,
  };
  if (sub_filter.holder_type_field && sub_filter.holder_type_value)
    scoped_record[sub_filter.holder_type_field] = sub_filter.holder_type_value;
  return scoped_record;
}

function list_denied_functionalities(
  profile: UserProfile,
  entity_type: string,
  sub_filter: SubEntityFilter,
): CrudFunctionality[] {
  const record = build_parent_scoped_record(sub_filter);
  const owners = build_record_owners_for_player(
    profile.player_id ?? NO_LINKED_PLAYER_ID,
  );
  return SUB_ENTITY_CRUD_ACTIONS.filter(
    (entry) =>
      !is_entity_action_permitted_for_record({
        role: profile.role,
        entity_type,
        action: entry.action,
        record,
        owners,
      }),
  ).map((entry) => entry.functionality);
}

export function compute_sub_entity_disabled_functionalities(
  profile_state: AuthProfileState,
  child_entity_type: string,
  sub_filter: SubEntityFilter,
): CrudFunctionality[] {
  if (profile_state.status !== PRESENCE_STATUS.PRESENT)
    return [...ALL_SUB_ENTITY_FUNCTIONALITIES];
  const entity_type = normalize_to_entity_type(child_entity_type);
  const denied = new Set([
    ...list_denied_functionalities(
      profile_state.profile,
      entity_type,
      sub_filter,
    ),
    ...get_entity_level_disabled_operations(entity_type),
  ]);
  const disabled_functionalities = ALL_SUB_ENTITY_FUNCTIONALITIES.filter(
    (functionality) => denied.has(functionality),
  );
  console.debug(SUB_ENTITY_PERMISSION_LOG_SCOPE, {
    event: SUB_ENTITY_PERMISSION_EVENT,
    entity_type,
    role: profile_state.profile.role,
    disabled_functionalities,
  });
  return disabled_functionalities;
}
