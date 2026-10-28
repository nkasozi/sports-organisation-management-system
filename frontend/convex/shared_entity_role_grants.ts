import type { SharedEntityType } from "./shared_entity_types";
import type {
  SharedCrudPermissions,
  SharedUserRole,
} from "./shared_permission_definitions";

export interface SharedEntityRoleGrant {
  role: SharedUserRole;
  entity_type: SharedEntityType;
  permissions: SharedCrudPermissions;
}

const CREATE_ONLY_PERMISSIONS: SharedCrudPermissions = {
  can_create: true,
  can_read: false,
  can_update: false,
  can_delete: false,
};

export const SHARED_ENTITY_ROLE_GRANTS: readonly SharedEntityRoleGrant[] = [
  {
    role: "official",
    entity_type: "livegamelog",
    permissions: CREATE_ONLY_PERMISSIONS,
  },
  {
    role: "official",
    entity_type: "gameeventlog",
    permissions: CREATE_ONLY_PERMISSIONS,
  },
  {
    role: "official",
    entity_type: "fixturelineup",
    permissions: CREATE_ONLY_PERMISSIONS,
  },
];

export const SHARED_TEAM_OWN_RECORD_GRANTS: readonly SharedEntityRoleGrant[] = [
  {
    role: "team_manager",
    entity_type: "playerteammembership",
    permissions: CREATE_ONLY_PERMISSIONS,
  },
];
