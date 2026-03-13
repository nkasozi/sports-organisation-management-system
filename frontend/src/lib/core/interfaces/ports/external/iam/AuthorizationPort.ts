import type { UserRole } from "./AuthenticationPort";
import type { AsyncResult } from "../../../../types/Result";
import { ANY_VALUE } from "./AuthenticationPort";
import type { AuthCache } from "$lib/infrastructure/cache/AuthCache";
import type {
  SharedEntityType,
  SharedEntityCategoryMap,
  SharedCrudPermissions,
} from "$convex/shared_permission_definitions";
import {
  SHARED_ENTITY_CATEGORY_MAP,
  SHARED_ROLE_PERMISSIONS,
} from "$convex/shared_permission_definitions";

export type DataAction = "create" | "read" | "update" | "delete";

export type DataCategory =
  | "root_level"
  | "org_administrator_level"
  | "organisation_level"
  | "team_level"
  | "player_level"
  | "public_level";

export type AuthorizableAction = "create" | "edit" | "delete" | "view" | "list";

export type AuthorizationLevel =
  | "full"
  | "organization"
  | "team"
  | "self"
  | "none";

export interface CategoryPermissions {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
}

export interface ProfilePermissions {
  role: UserRole;
  permissions: Record<DataCategory, CategoryPermissions>;
}

export interface AuthorizationFailure {
  failure_type: "token_invalid" | "token_expired" | "permission_denied";
  message: string;
}

export interface RouteAccessGranted {
  route: string;
  all_accessible_routes: SidebarMenuGroup[];
}

export interface RouteAccessDenied {
  route: string;
  message: string;
}

export interface SidebarMenuItem {
  name: string;
  href: string;
  icon: string;
}

export interface SidebarMenuGroup {
  group_name: string;
  items: SidebarMenuItem[];
}

export interface EntityAuthorizationMap {
  entity_type: string;
  authorizations: Map<AuthorizableAction, AuthorizationLevel>;
}

export interface AuthorizationCheckResult {
  is_authorized: boolean;
  authorization_level: AuthorizationLevel;
  error_message?: string;
}

export interface FeatureAccess {
  can_reset_demo: boolean;
  can_view_audit_logs: boolean;
  can_access_dashboard: boolean;
  can_switch_profiles: boolean;
  audit_logs_scope: "all" | "organization" | "team" | "none";
}

export type AuthorizationFailureReason =
  | "token_invalid"
  | "token_expired"
  | "permission_denied";

export interface EntityAuthorizationResult {
  is_authorized: boolean;
  failure_reason?: AuthorizationFailureReason;
  data_category?: DataCategory;
  role?: UserRole;
  reason?: string;
}

export interface AuthorizationPort {
  get_profile_permissions(
    raw_token: string,
  ): AsyncResult<ProfilePermissions, AuthorizationFailure>;

  get_sidebar_menu_for_profile(
    raw_token: string,
  ): AsyncResult<SidebarMenuGroup[], AuthorizationFailure>;

  can_profile_access_route(
    raw_token: string,
    route: string,
  ): AsyncResult<RouteAccessGranted, RouteAccessDenied>;

  check_entity_authorized(
    raw_token: string,
    entity_type: string,
    action: DataAction,
  ): AsyncResult<EntityAuthorizationResult>;

  get_allowed_entity_actions(
    raw_token: string,
    entity_type: string,
  ): AsyncResult<DataAction[]>;

  get_disabled_entity_actions(
    raw_token: string,
    entity_type: string,
  ): AsyncResult<DataAction[]>;

  get_authorization_cache(): AuthCache<unknown>;

  get_sidebar_menu_for_role(role: UserRole): AsyncResult<SidebarMenuGroup[]>;

  get_accessible_routes_for_role(role: UserRole): AsyncResult<string[]>;
}

export type ScopeDimension =
  | "organization_id"
  | "team_id"
  | "player_id"
  | "official_id";

export interface UserScopeProfile {
  organization_id: string;
  team_id: string;
  player_id?: string;
  official_id?: string;
}

export type RolePermissionMap = Record<DataCategory, CategoryPermissions>;

export type FullPermissionMap = Record<UserRole, RolePermissionMap>;

export interface DataAuthorizationResult {
  is_authorized: boolean;
  data_category: DataCategory;
  action: DataAction;
  reason?: string;
}

export const ENTITY_LEVEL_DISABLED_OPERATIONS: Partial<
  Record<SharedEntityType, ("create" | "edit" | "delete")[]>
> = {
  playerteamtransferhistory: ["delete"],
  playerteammembership: ["edit"],
};

export function get_entity_level_disabled_operations(
  entity_type: SharedEntityType,
): ("create" | "edit" | "delete")[] {
  return ENTITY_LEVEL_DISABLED_OPERATIONS[entity_type] ?? [];
}

export function normalize_to_entity_type(raw: string): SharedEntityType {
  return raw.toLowerCase().replace(/[\s_-]/g, "") as SharedEntityType;
}

export function get_entity_data_category(
  entity_type: SharedEntityType,
): DataCategory {
  return SHARED_ENTITY_CATEGORY_MAP[entity_type] || "organisation_level";
}

function shared_to_category_permissions(
  shared: SharedCrudPermissions,
): CategoryPermissions {
  return {
    create: shared.can_create,
    read: shared.can_read,
    update: shared.can_update,
    delete: shared.can_delete,
  };
}

export function get_role_permissions(role: UserRole): RolePermissionMap {
  const shared =
    SHARED_ROLE_PERMISSIONS[role] ?? SHARED_ROLE_PERMISSIONS.player;
  return Object.fromEntries(
    Object.entries(shared).map(([category, perms]) => [
      category,
      shared_to_category_permissions(perms),
    ]),
  ) as RolePermissionMap;
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
  entity_type: SharedEntityType,
  action: DataAction,
): boolean {
  const category = get_entity_data_category(entity_type);
  return check_data_permission(role, category, action);
}

function authorize_entity_action(
  role: UserRole,
  entity_type: SharedEntityType,
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

function get_allowed_actions_for_entity(
  role: UserRole,
  entity_type: SharedEntityType,
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

function get_disabled_crud_for_entity(
  role: UserRole,
  entity_type: SharedEntityType,
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

function has_unrestricted_scope(
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

function is_unrestricted_value(value: string | undefined | null): boolean {
  return value === ANY_VALUE || !value;
}

function is_restricted_value(value: string | undefined | null): boolean {
  return !is_unrestricted_value(value);
}
