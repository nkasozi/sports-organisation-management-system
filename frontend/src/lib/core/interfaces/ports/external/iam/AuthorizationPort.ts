import type { AuthCache } from "$lib/infrastructure/cache/AuthCache";

import type { AsyncResult } from "../../../../types/Result";
import type { UserRole } from "./AuthenticationPort";

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

  get_default_route_for_role(role: UserRole): AsyncResult<string>;
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

type FullPermissionMap = Record<UserRole, RolePermissionMap>;

export interface DataAuthorizationResult {
  is_authorized: boolean;
  data_category: DataCategory;
  action: DataAction;
  reason?: string;
}

export {
  check_data_permission,
  check_entity_permission,
  get_entity_data_category,
  get_entity_level_disabled_operations,
  get_role_permissions,
  normalize_to_entity_type,
} from "./authorizationPermissionChecks";
export {
  build_authorization_list_filter,
  get_authorization_preselect_values,
  get_authorization_restricted_fields,
  get_scope_value,
  is_field_restricted_by_authorization,
  is_scope_restricted,
} from "./authorizationScopeUtils";
