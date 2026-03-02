import type { UserRole } from "./AuthenticationPort";
import { ANY_VALUE } from "./AuthenticationPort";

export type DataCategory =
  | "root_level"
  | "org_administrator_level"
  | "organisation_level"
  | "team_level"
  | "player_level";

export type DataAction = "create" | "read" | "update" | "delete";

export type ScopeDimension = "organization_id" | "team_id" | "player_id";

export interface UserScopeProfile {
  organization_id: string;
  team_id: string;
  player_id?: string;
}

export interface CategoryPermissions {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
}

export type RolePermissionMap = Record<DataCategory, CategoryPermissions>;

export type FullPermissionMap = Record<UserRole, RolePermissionMap>;

const NO_PERMISSIONS: CategoryPermissions = {
  create: false,
  read: false,
  update: false,
  delete: false,
};

const FULL_PERMISSIONS: CategoryPermissions = {
  create: true,
  read: true,
  update: true,
  delete: true,
};

const READ_ONLY_PERMISSIONS: CategoryPermissions = {
  create: false,
  read: true,
  update: false,
  delete: false,
};

export const DATA_PERMISSION_MAP: FullPermissionMap = {
  super_admin: {
    root_level: FULL_PERMISSIONS,
    org_administrator_level: FULL_PERMISSIONS,
    organisation_level: FULL_PERMISSIONS,
    team_level: FULL_PERMISSIONS,
    player_level: FULL_PERMISSIONS,
  },

  org_admin: {
    root_level: READ_ONLY_PERMISSIONS,
    org_administrator_level: FULL_PERMISSIONS,
    organisation_level: FULL_PERMISSIONS,
    team_level: FULL_PERMISSIONS,
    player_level: FULL_PERMISSIONS,
  },

  officials_manager: {
    root_level: READ_ONLY_PERMISSIONS,
    org_administrator_level: NO_PERMISSIONS,
    organisation_level: {
      create: false,
      read: true,
      update: true,
      delete: false,
    },
    team_level: READ_ONLY_PERMISSIONS,
    player_level: READ_ONLY_PERMISSIONS,
  },

  team_manager: {
    root_level: READ_ONLY_PERMISSIONS,
    org_administrator_level: NO_PERMISSIONS,
    organisation_level: READ_ONLY_PERMISSIONS,
    team_level: FULL_PERMISSIONS,
    player_level: FULL_PERMISSIONS,
  },

  official: {
    root_level: READ_ONLY_PERMISSIONS,
    org_administrator_level: NO_PERMISSIONS,
    organisation_level: READ_ONLY_PERMISSIONS,
    team_level: READ_ONLY_PERMISSIONS,
    player_level: READ_ONLY_PERMISSIONS,
  },

  player: {
    root_level: READ_ONLY_PERMISSIONS,
    org_administrator_level: NO_PERMISSIONS,
    organisation_level: READ_ONLY_PERMISSIONS,
    team_level: READ_ONLY_PERMISSIONS,
    player_level: { create: true, read: true, update: true, delete: false },
  },
};

export const ENTITY_DATA_CATEGORY_MAP: Record<string, DataCategory> = {
  organization: "root_level",
  sport: "root_level",
  gender: "root_level",
  competitionformat: "root_level",
  identificationtype: "root_level",
  gameofficialrole: "root_level",
  gameeventtype: "root_level",
  teamstaffrole: "root_level",
  playerposition: "root_level",

  settings: "org_administrator_level",
  systemsettings: "org_administrator_level",

  competition: "organisation_level",
  team: "organisation_level",
  official: "organisation_level",
  venue: "organisation_level",
  fixture: "organisation_level",
  fixturedetailssetup: "organisation_level",
  livegamelog: "organisation_level",
  gameeventlog: "organisation_level",
  auditlog: "organisation_level",
  systemuser: "organisation_level",
  playerteammembership: "organisation_level",
  playerteamtransferhistory: "organisation_level",

  teamstaff: "team_level",
  fixturelineup: "team_level",
  competitionteam: "team_level",

  player: "player_level",
  playerprofile: "player_level",
  identification: "player_level",
  qualification: "player_level",
  jerseycolor: "player_level",
  profilelink: "player_level",
  activitycategory: "player_level",
  teamprofile: "player_level",
};

export function get_entity_data_category(entity_type: string): DataCategory {
  const normalized_type = entity_type.toLowerCase().replace(/[\s_-]/g, "");
  return ENTITY_DATA_CATEGORY_MAP[normalized_type] || "organisation_level";
}

export function get_role_permissions(role: UserRole): RolePermissionMap {
  return DATA_PERMISSION_MAP[role] || DATA_PERMISSION_MAP.player;
}

export function check_data_permission(
  role: UserRole,
  category: DataCategory,
  action: DataAction,
): boolean {
  const role_permissions = get_role_permissions(role);
  const category_permissions = role_permissions[category];
  return category_permissions[action];
}

export function check_entity_permission(
  role: UserRole,
  entity_type: string,
  action: DataAction,
): boolean {
  const category = get_entity_data_category(entity_type);
  return check_data_permission(role, category, action);
}

export interface DataAuthorizationResult {
  is_authorized: boolean;
  data_category: DataCategory;
  action: DataAction;
  reason?: string;
}

export function authorize_entity_action(
  role: UserRole,
  entity_type: string,
  action: DataAction,
): DataAuthorizationResult {
  const category = get_entity_data_category(entity_type);
  const is_authorized = check_data_permission(role, category, action);

  return {
    is_authorized,
    data_category: category,
    action,
    reason: is_authorized
      ? undefined
      : `Role "${role}" does not have "${action}" permission for "${category}" data`,
  };
}

export function get_allowed_actions_for_entity(
  role: UserRole,
  entity_type: string,
): DataAction[] {
  const category = get_entity_data_category(entity_type);
  const permissions = get_role_permissions(role)[category];

  const allowed_actions: DataAction[] = [];
  if (permissions.create) allowed_actions.push("create");
  if (permissions.read) allowed_actions.push("read");
  if (permissions.update) allowed_actions.push("update");
  if (permissions.delete) allowed_actions.push("delete");

  return allowed_actions;
}

export function get_disabled_crud_for_entity(
  role: UserRole,
  entity_type: string,
): ("create" | "read" | "update" | "delete")[] {
  const category = get_entity_data_category(entity_type);
  const permissions = get_role_permissions(role)[category];

  const disabled: ("create" | "read" | "update" | "delete")[] = [];
  if (!permissions.create) disabled.push("create");
  if (!permissions.read) disabled.push("read");
  if (!permissions.update) disabled.push("update");
  if (!permissions.delete) disabled.push("delete");

  return disabled;
}

export function has_unrestricted_scope(
  profile: UserScopeProfile | null,
  dimension: ScopeDimension,
): boolean {
  if (!profile) return false;
  const value = profile[dimension];
  return value === ANY_VALUE || value === undefined;
}

export function is_scope_restricted(
  profile: UserScopeProfile | null,
  dimension: ScopeDimension,
): boolean {
  return !has_unrestricted_scope(profile, dimension);
}

export function get_scope_value(
  profile: UserScopeProfile | null,
  dimension: ScopeDimension,
): string | null {
  if (!profile) return null;
  const value = profile[dimension];
  if (!value || value === ANY_VALUE) return null;
  return value;
}

export function get_authorization_restricted_fields(
  profile: UserScopeProfile | null,
): Set<string> {
  const restricted = new Set<string>();
  if (!profile) return restricted;

  if (is_scope_restricted(profile, "organization_id")) {
    restricted.add("organization_id");
  }
  if (is_scope_restricted(profile, "team_id")) {
    restricted.add("team_id");
  }
  if (is_scope_restricted(profile, "player_id")) {
    restricted.add("player_id");
  }

  return restricted;
}

export function get_authorization_preselect_values(
  profile: UserScopeProfile | null,
): Record<string, string> {
  const preselect_values: Record<string, string> = {};
  if (!profile) return preselect_values;

  const org_value = get_scope_value(profile, "organization_id");
  if (org_value) {
    preselect_values["organization_id"] = org_value;
  }

  const team_value = get_scope_value(profile, "team_id");
  if (team_value) {
    preselect_values["team_id"] = team_value;
  }

  const player_value = get_scope_value(profile, "player_id");
  if (player_value) {
    preselect_values["player_id"] = player_value;
  }

  return preselect_values;
}

export function build_authorization_list_filter(
  profile: UserScopeProfile | null,
  entity_fields: string[],
): Record<string, string> {
  const filter: Record<string, string> = {};
  if (!profile) return filter;

  const org_value = get_scope_value(profile, "organization_id");
  if (org_value && entity_fields.includes("organization_id")) {
    filter["organization_id"] = org_value;
  }

  const team_value = get_scope_value(profile, "team_id");
  if (team_value && entity_fields.includes("team_id")) {
    filter["team_id"] = team_value;
  }

  const player_value = get_scope_value(profile, "player_id");
  if (player_value && entity_fields.includes("player_id")) {
    filter["player_id"] = player_value;
  }

  return filter;
}

export function is_field_restricted_by_authorization(
  profile: UserScopeProfile | null,
  field_name: string,
): boolean {
  const restricted = get_authorization_restricted_fields(profile);
  return restricted.has(field_name);
}

export function is_unrestricted_value(
  value: string | undefined | null,
): boolean {
  return value === ANY_VALUE || !value;
}

export function is_restricted_value(value: string | undefined | null): boolean {
  return !is_unrestricted_value(value);
}
