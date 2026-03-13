export type SharedUserRole =
  | "super_admin"
  | "org_admin"
  | "officials_manager"
  | "team_manager"
  | "official"
  | "player"
  | "public_viewer";

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

export type SharedEntityType =
  | "organization"
  | "sport"
  | "gender"
  | "competitionformat"
  | "identificationtype"
  | "gameofficialrole"
  | "gameeventtype"
  | "teamstaffrole"
  | "playerposition"
  | "help"
  | "settings"
  | "systemsettings"
  | "auditlog"
  | "systemuser"
  | "competition"
  | "team"
  | "official"
  | "venue"
  | "fixture"
  | "fixturedetailssetup"
  | "livegamelog"
  | "gameeventlog"
  | "playerteammembership"
  | "playerteamtransferhistory"
  | "teamstaff"
  | "fixturelineup"
  | "competitionteam"
  | "player"
  | "playerprofile"
  | "identification"
  | "qualification"
  | "jerseycolor"
  | "profilelink"
  | "activitycategory"
  | "teamprofile";

export interface SharedEntityCategory {
  entity_type: SharedEntityType;
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

const CREATE_READ_UPDATE_NO_DELETE: SharedCrudPermissions = {
  can_create: true,
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
    organisation_level: CREATE_READ_UPDATE_NO_DELETE,
    team_level: CREATE_READ_UPDATE_NO_DELETE,
    player_level: READ_ONLY,
    public_level: FULL_PERMISSIONS,
  },
  team_manager: {
    root_level: READ_ONLY,
    org_administrator_level: NO_PERMISSIONS,
    organisation_level: READ_ONLY,
    team_level: READ_UPDATE,
    player_level: CREATE_READ_UPDATE_NO_DELETE,
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
  public_viewer: {
    root_level: READ_ONLY,
    org_administrator_level: NO_PERMISSIONS,
    organisation_level: READ_ONLY,
    team_level: READ_ONLY,
    player_level: READ_ONLY,
    public_level: READ_ONLY,
  },
};

export type SharedEntityCategoryMap = Record<
  SharedEntityType,
  SharedDataCategory
>;

export const SHARED_ENTITY_CATEGORY_MAP: SharedEntityCategoryMap = {
  organization: "root_level",
  sport: "root_level",
  gender: "org_administrator_level",
  competitionformat: "organisation_level",
  identificationtype: "org_administrator_level",
  gameofficialrole: "org_administrator_level",
  gameeventtype: "org_administrator_level",
  teamstaffrole: "org_administrator_level",
  playerposition: "org_administrator_level",
  help: "root_level",
  settings: "org_administrator_level",
  systemsettings: "org_administrator_level",
  auditlog: "org_administrator_level",
  systemuser: "org_administrator_level",
  competition: "organisation_level",
  team: "team_level",
  official: "organisation_level",
  venue: "organisation_level",
  fixture: "organisation_level",
  fixturedetailssetup: "organisation_level",
  livegamelog: "organisation_level",
  gameeventlog: "organisation_level",
  playerteammembership: "organisation_level",
  playerteamtransferhistory: "organisation_level",
  teamstaff: "team_level",
  fixturelineup: "player_level",
  competitionteam: "team_level",
  player: "player_level",
  playerprofile: "public_level",
  identification: "public_level",
  qualification: "public_level",
  jerseycolor: "public_level",
  profilelink: "public_level",
  activitycategory: "public_level",
  teamprofile: "public_level",
};

export const SHARED_ENTITY_CATEGORIES: SharedEntityCategory[] = (
  Object.entries(SHARED_ENTITY_CATEGORY_MAP) as [
    SharedEntityType,
    SharedDataCategory,
  ][]
).map(([entity_type, data_category]) => ({ entity_type, data_category }));

export const ALL_ROLES: SharedUserRole[] = [
  "super_admin",
  "org_admin",
  "officials_manager",
  "team_manager",
  "official",
  "player",
  "public_viewer",
];

export const ALL_CATEGORIES: SharedDataCategory[] = [
  "root_level",
  "org_administrator_level",
  "organisation_level",
  "team_level",
  "player_level",
  "public_level",
];
