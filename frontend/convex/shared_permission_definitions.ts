export type SharedUserRole =
  | "super_admin"
  | "org_admin"
  | "officials_manager"
  | "team_manager"
  | "official"
  | "player";

export type SharedDataCategory =
  | "root_level"
  | "org_administrator_level"
  | "organisation_level"
  | "team_level"
  | "player_level"
  | "public_level";

export interface SharedCrudPermissions {
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
}

export interface SharedEntityCategory {
  entity_type: string;
  data_category: SharedDataCategory;
}

const FULL_PERMISSIONS: SharedCrudPermissions = {
  can_create: true,
  can_read: true,
  can_update: true,
  can_delete: true,
};

const READ_ONLY: SharedCrudPermissions = {
  can_create: false,
  can_read: true,
  can_update: false,
  can_delete: false,
};

const NO_PERMISSIONS: SharedCrudPermissions = {
  can_create: false,
  can_read: false,
  can_update: false,
  can_delete: false,
};

const READ_UPDATE: SharedCrudPermissions = {
  can_create: false,
  can_read: true,
  can_update: true,
  can_delete: false,
};

export type SharedPermissionMap = Record<
  SharedUserRole,
  Record<SharedDataCategory, SharedCrudPermissions>
>;

export const SHARED_ROLE_PERMISSIONS: SharedPermissionMap = {
  super_admin: {
    root_level: FULL_PERMISSIONS,
    org_administrator_level: FULL_PERMISSIONS,
    organisation_level: FULL_PERMISSIONS,
    team_level: FULL_PERMISSIONS,
    player_level: FULL_PERMISSIONS,
    public_level: FULL_PERMISSIONS,
  },
  org_admin: {
    root_level: READ_ONLY,
    org_administrator_level: FULL_PERMISSIONS,
    organisation_level: FULL_PERMISSIONS,
    team_level: FULL_PERMISSIONS,
    player_level: FULL_PERMISSIONS,
    public_level: FULL_PERMISSIONS,
  },
  officials_manager: {
    root_level: READ_ONLY,
    org_administrator_level: NO_PERMISSIONS,
    organisation_level: READ_UPDATE,
    team_level: {
      can_create: true,
      can_read: true,
      can_update: true,
      can_delete: false,
    },
    player_level: READ_ONLY,
    public_level: FULL_PERMISSIONS,
  },
  team_manager: {
    root_level: READ_ONLY,
    org_administrator_level: NO_PERMISSIONS,
    organisation_level: READ_ONLY,
    team_level: READ_UPDATE,
    player_level: READ_UPDATE,
    public_level: FULL_PERMISSIONS,
  },
  official: {
    root_level: READ_ONLY,
    org_administrator_level: NO_PERMISSIONS,
    organisation_level: READ_UPDATE,
    team_level: READ_ONLY,
    player_level: READ_ONLY,
    public_level: FULL_PERMISSIONS,
  },
  player: {
    root_level: READ_ONLY,
    org_administrator_level: NO_PERMISSIONS,
    organisation_level: READ_ONLY,
    team_level: READ_ONLY,
    player_level: READ_UPDATE,
    public_level: FULL_PERMISSIONS,
  },
};

export const SHARED_ENTITY_CATEGORIES: SharedEntityCategory[] = [
  { entity_type: "organization", data_category: "root_level" },
  { entity_type: "sport", data_category: "root_level" },
  { entity_type: "gender", data_category: "root_level" },
  { entity_type: "competitionformat", data_category: "root_level" },
  { entity_type: "identificationtype", data_category: "root_level" },
  { entity_type: "gameofficialrole", data_category: "root_level" },
  { entity_type: "gameeventtype", data_category: "root_level" },
  { entity_type: "teamstaffrole", data_category: "root_level" },
  { entity_type: "playerposition", data_category: "root_level" },
  { entity_type: "help", data_category: "root_level" },
  { entity_type: "settings", data_category: "org_administrator_level" },
  { entity_type: "systemsettings", data_category: "org_administrator_level" },
  { entity_type: "auditlog", data_category: "org_administrator_level" },
  { entity_type: "systemuser", data_category: "org_administrator_level" },
  { entity_type: "competition", data_category: "organisation_level" },
  { entity_type: "team", data_category: "team_level" },
  { entity_type: "official", data_category: "organisation_level" },
  { entity_type: "venue", data_category: "organisation_level" },
  { entity_type: "fixture", data_category: "team_level" },
  { entity_type: "fixturedetailssetup", data_category: "team_level" },
  { entity_type: "livegamelog", data_category: "organisation_level" },
  { entity_type: "gameeventlog", data_category: "organisation_level" },
  {
    entity_type: "playerteammembership",
    data_category: "organisation_level",
  },
  {
    entity_type: "playerteamtransferhistory",
    data_category: "organisation_level",
  },
  { entity_type: "teamstaff", data_category: "team_level" },
  { entity_type: "fixturelineup", data_category: "team_level" },
  { entity_type: "competitionteam", data_category: "team_level" },
  { entity_type: "player", data_category: "player_level" },
  { entity_type: "playerprofile", data_category: "public_level" },
  { entity_type: "identification", data_category: "public_level" },
  { entity_type: "qualification", data_category: "public_level" },
  { entity_type: "jerseycolor", data_category: "public_level" },
  { entity_type: "profilelink", data_category: "public_level" },
  { entity_type: "activitycategory", data_category: "public_level" },
  { entity_type: "teamprofile", data_category: "public_level" },
];

export const ALL_ROLES: SharedUserRole[] = [
  "super_admin",
  "org_admin",
  "officials_manager",
  "team_manager",
  "official",
  "player",
];

export const ALL_CATEGORIES: SharedDataCategory[] = [
  "root_level",
  "org_administrator_level",
  "organisation_level",
  "team_level",
  "player_level",
  "public_level",
];
