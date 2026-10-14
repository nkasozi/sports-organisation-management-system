import {
  is_record_owned_by_shared_owners,
  resolve_shared_entity_permission_scope,
  SharedPermissionScope,
  type SharedPermissionScopeValue,
  type SharedTeamRecordOwners,
} from "$convex/shared_own_record_permissions";

import type { DataAction } from "./AuthorizationPort";

export const ENTITY_PERMISSION_SCOPE = SharedPermissionScope;

export type EntityPermissionScope = SharedPermissionScopeValue;

export type RecordOwners = SharedTeamRecordOwners;

interface RecordOwnerProfile {
  role: string;
  team_id: string;
  player_id: string;
}

const TEAM_MANAGER_ROLE = "team_manager";

function build_trimmed_id_set(raw_id: string): ReadonlySet<string> {
  const trimmed_id = raw_id.trim();
  return new Set(trimmed_id.length > 0 ? [trimmed_id] : []);
}

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
  return { player_ids: build_trimmed_id_set(player_id), team_ids: new Set() };
}

export function build_record_owners_for_profile(
  profile: RecordOwnerProfile,
): RecordOwners {
  return {
    player_ids: build_trimmed_id_set(profile.player_id),
    team_ids:
      profile.role === TEAM_MANAGER_ROLE
        ? build_trimmed_id_set(profile.team_id)
        : new Set(),
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
