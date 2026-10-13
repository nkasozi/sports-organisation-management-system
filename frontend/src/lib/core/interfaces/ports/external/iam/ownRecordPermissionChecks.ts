import {
  is_record_owned_by_shared_owners,
  resolve_shared_entity_permission_scope,
  SharedPermissionScope,
  type SharedPermissionScopeValue,
  type SharedRecordOwners,
} from "$convex/shared_own_record_permissions";

import type { DataAction } from "./AuthorizationPort";

export const ENTITY_PERMISSION_SCOPE = SharedPermissionScope;

export type EntityPermissionScope = SharedPermissionScopeValue;

export type RecordOwners = SharedRecordOwners;

interface RecordPermissionCheck {
  role: string;
  entity_type: string;
  action: DataAction;
  record: Readonly<Record<string, unknown>>;
  owners: RecordOwners;
}

export function resolve_entity_permission_scope(
  role: string,
  entity_type: string,
  action: DataAction,
): EntityPermissionScope {
  return resolve_shared_entity_permission_scope(role, entity_type, action);
}

export function check_entity_permission_in_any_scope(
  role: string,
  entity_type: string,
  action: DataAction,
): boolean {
  return (
    resolve_entity_permission_scope(role, entity_type, action) !==
    ENTITY_PERMISSION_SCOPE.NONE
  );
}

export function build_record_owners_for_player(
  player_id: string,
): RecordOwners {
  const trimmed_player_id = player_id.trim();
  return {
    player_ids: new Set(
      trimmed_player_id.length > 0 ? [trimmed_player_id] : [],
    ),
  };
}

export function is_entity_action_permitted_for_record(
  check: RecordPermissionCheck,
): boolean {
  const scope = resolve_entity_permission_scope(
    check.role,
    check.entity_type,
    check.action,
  );
  switch (scope) {
    case ENTITY_PERMISSION_SCOPE.ALL_RECORDS:
      return true;
    case ENTITY_PERMISSION_SCOPE.OWN_RECORDS:
      return is_record_owned_by_shared_owners(
        check.entity_type,
        check.record,
        check.owners,
      );
    case ENTITY_PERMISSION_SCOPE.NONE:
      return false;
  }
}
