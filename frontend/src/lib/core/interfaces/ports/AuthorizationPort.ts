import type { AuthToken, UserRole } from "./AuthenticationPort";

export type AuthorizableAction = "create" | "edit" | "delete" | "list" | "view";

export type AuthorizationLevel =
  | "any"
  | "organization"
  | "team"
  | "player"
  | "none";

export const AUTHORIZATION_LEVEL_HIERARCHY: Record<AuthorizationLevel, number> =
  {
    any: 100,
    organization: 75,
    team: 50,
    player: 25,
    none: 0,
  };

export interface ActionAuthorization {
  action: AuthorizableAction;
  level: AuthorizationLevel;
}

export interface EntityAuthorizationMap {
  entity_type: string;
  authorizations: Map<AuthorizableAction, AuthorizationLevel>;
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

export interface AuthorizationCheckResult {
  is_authorized: boolean;
  authorization_level: AuthorizationLevel;
  error_message?: string;
  restricted_to_organization_id?: string;
  restricted_to_team_id?: string;
}

export interface FeatureAccess {
  can_reset_demo: boolean;
  can_view_audit_logs: boolean;
  can_access_dashboard: boolean;
  audit_logs_scope: AuthorizationLevel;
}

export const ENTITY_TYPES = [
  "organization",
  "competition",
  "competitionformat",
  "team",
  "teamprofile",
  "teamstaff",
  "teamstaffrole",
  "player",
  "playerprofile",
  "playerposition",
  "playerteammembership",
  "playerteamtransferhistory",
  "official",
  "gameofficialrole",
  "fixture",
  "fixturelineup",
  "fixturedetailssetup",
  "gameeventtype",
  "venue",
  "sport",
  "identificationtype",
  "gender",
  "identification",
  "qualification",
  "systemuser",
  "auditlog",
  "jerseycolor",
  "profilelink",
  "officialassociatedteam",
] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];

export interface AuthorizationPort {
  get_sidebar_menu_items(token: AuthToken): SidebarMenuGroup[];

  get_user_authorization_level(
    token: AuthToken,
    entity_type: string,
  ): EntityAuthorizationMap;

  is_authorized_to_execute(
    token: AuthToken,
    action: AuthorizableAction,
    entity_type: string,
    entity_id?: string,
    target_organization_id?: string,
    target_team_id?: string,
  ): AuthorizationCheckResult;

  get_feature_access(token: AuthToken): FeatureAccess;

  get_authorization_error_message(
    role: UserRole,
    action: AuthorizableAction,
    entity_type: string,
  ): string;
}
