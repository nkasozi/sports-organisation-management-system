import { mutation } from "./_generated/server";

export type UserRole =
  | "super_admin"
  | "org_admin"
  | "officials_manager"
  | "team_manager"
  | "official"
  | "player";

export type DataCategory =
  | "root_level"
  | "org_administrator_level"
  | "organisation_level"
  | "team_level"
  | "player_level"
  | "public_level";

interface RolePermission {
  role: UserRole;
  data_category: DataCategory;
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
}

interface EntityCategory {
  entity_type: string;
  data_category: DataCategory;
}

interface MenuItem {
  role: UserRole;
  group_name: string;
  group_order: number;
  item_name: string;
  item_href: string;
  item_icon: string;
  item_order: number;
}

const FULL_PERMISSIONS = {
  can_create: true,
  can_read: true,
  can_update: true,
  can_delete: true,
};
const READ_ONLY = {
  can_create: false,
  can_read: true,
  can_update: false,
  can_delete: false,
};
const NO_PERMISSIONS = {
  can_create: false,
  can_read: false,
  can_update: false,
  can_delete: false,
};
const READ_UPDATE = {
  can_create: false,
  can_read: true,
  can_update: true,
  can_delete: false,
};

function build_role_permissions(): RolePermission[] {
  const PERMISSIONS_MAP: Record<
    UserRole,
    Record<
      DataCategory,
      {
        can_create: boolean;
        can_read: boolean;
        can_update: boolean;
        can_delete: boolean;
      }
    >
  > = {
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
      team_level: READ_ONLY,
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

  const result: RolePermission[] = [];
  const roles: UserRole[] = [
    "super_admin",
    "org_admin",
    "officials_manager",
    "team_manager",
    "official",
    "player",
  ];
  const categories: DataCategory[] = [
    "root_level",
    "org_administrator_level",
    "organisation_level",
    "team_level",
    "player_level",
    "public_level",
  ];

  for (const role of roles) {
    for (const category of categories) {
      const perms = PERMISSIONS_MAP[role][category];
      result.push({
        role,
        data_category: category,
        ...perms,
      });
    }
  }

  return result;
}

function build_entity_categories(): EntityCategory[] {
  return [
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
    { entity_type: "fixture", data_category: "organisation_level" },
    { entity_type: "fixturedetailssetup", data_category: "organisation_level" },
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
}

const DASHBOARD_ICON =
  "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6";
const CALENDAR_ICON =
  "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z";
const LIVE_GAMES_ICON =
  "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z";
const RESULTS_ICON =
  "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z";
const HELP_ICON =
  "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z";
const ORG_ICON =
  "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4";
const SPORTS_ICON =
  "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z";
const VENUES_ICON =
  "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z";
const COMPETITIONS_ICON =
  "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z";
const FORMATS_ICON =
  "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10";
const TEAMS_ICON =
  "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z";
const PROFILE_ICON =
  "M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z";
const STAFF_ICON =
  "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z";
const TAG_ICON =
  "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z";
const PLAYERS_ICON =
  "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z";
const MEMBERSHIP_ICON =
  "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z";
const TRANSFER_ICON = "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4";
const POSITIONS_ICON =
  "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7";
const OFFICIALS_ICON =
  "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z";
const LINEUPS_ICON =
  "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01";
const EVENTS_ICON = "M13 10V3L4 14h7v7l9-11h-7z";
const SETTINGS_ICON =
  "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z";
const ID_ICON =
  "M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2";
const AUDIT_ICON =
  "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4";
const USERS_ICON =
  "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z";
const GENDERS_ICON =
  "M7 8a5 5 0 1110 0 5 5 0 01-10 0zm10 0v4m0 0h4m-4 0l-2 2m-6 2a4 4 0 108 0 4 4 0 00-8 0z";

function build_sidebar_menu_items(): MenuItem[] {
  const items: MenuItem[] = [];

  function add_item(
    role: UserRole,
    group_name: string,
    group_order: number,
    item_name: string,
    item_href: string,
    item_icon: string,
    item_order: number,
  ): void {
    items.push({
      role,
      group_name,
      group_order,
      item_name,
      item_href,
      item_icon,
      item_order,
    });
  }

  add_item("super_admin", "Home", 1, "Dashboard", "/", DASHBOARD_ICON, 1);
  add_item("super_admin", "Home", 1, "Calendar", "/calendar", CALENDAR_ICON, 2);
  add_item(
    "super_admin",
    "Home",
    1,
    "Live Games",
    "/live-games",
    LIVE_GAMES_ICON,
    3,
  );
  add_item(
    "super_admin",
    "Home",
    1,
    "Competition Results",
    "/competition-results",
    RESULTS_ICON,
    4,
  );
  add_item("super_admin", "Home", 1, "Help", "/help", HELP_ICON, 5);
  add_item(
    "super_admin",
    "Organization",
    2,
    "Organizations",
    "/organizations",
    ORG_ICON,
    1,
  );
  add_item(
    "super_admin",
    "Organization",
    2,
    "Sports",
    "/sports",
    SPORTS_ICON,
    2,
  );
  add_item(
    "super_admin",
    "Organization",
    2,
    "Venues",
    "/venues",
    VENUES_ICON,
    3,
  );
  add_item(
    "super_admin",
    "Competitions",
    3,
    "Competitions",
    "/competitions",
    COMPETITIONS_ICON,
    1,
  );
  add_item(
    "super_admin",
    "Competitions",
    3,
    "Competition Formats",
    "/competition-formats",
    FORMATS_ICON,
    2,
  );
  add_item("super_admin", "Teams", 4, "Teams", "/teams", TEAMS_ICON, 1);
  add_item(
    "super_admin",
    "Teams",
    4,
    "Team Profiles",
    "/team-profiles",
    PROFILE_ICON,
    2,
  );
  add_item(
    "super_admin",
    "Teams",
    4,
    "Team Staff",
    "/team-staff",
    STAFF_ICON,
    3,
  );
  add_item(
    "super_admin",
    "Teams",
    4,
    "Staff Roles",
    "/staff-roles",
    TAG_ICON,
    4,
  );
  add_item("super_admin", "Players", 5, "Players", "/players", PLAYERS_ICON, 1);
  add_item(
    "super_admin",
    "Players",
    5,
    "Player Profiles",
    "/player-profiles",
    PROFILE_ICON,
    2,
  );
  add_item(
    "super_admin",
    "Players",
    5,
    "Player Team Memberships",
    "/player-team-memberships",
    MEMBERSHIP_ICON,
    3,
  );
  add_item(
    "super_admin",
    "Players",
    5,
    "Player Transfers",
    "/player-transfers",
    TRANSFER_ICON,
    4,
  );
  add_item(
    "super_admin",
    "Players",
    5,
    "Player Positions",
    "/player-positions",
    POSITIONS_ICON,
    5,
  );
  add_item(
    "super_admin",
    "Officials",
    6,
    "Officials",
    "/officials",
    OFFICIALS_ICON,
    1,
  );
  add_item(
    "super_admin",
    "Officials",
    6,
    "Official Roles",
    "/official-roles",
    TAG_ICON,
    2,
  );
  add_item(
    "super_admin",
    "Fixtures & Games",
    7,
    "Fixtures",
    "/fixtures",
    CALENDAR_ICON,
    1,
  );
  add_item(
    "super_admin",
    "Fixtures & Games",
    7,
    "Team Lineups",
    "/fixture-lineups",
    LINEUPS_ICON,
    2,
  );
  add_item(
    "super_admin",
    "Fixtures & Games",
    7,
    "Fixture Details Setup",
    "/fixture-details-setup",
    OFFICIALS_ICON,
    3,
  );
  add_item(
    "super_admin",
    "Fixtures & Games",
    7,
    "Game Event Types",
    "/event-types",
    EVENTS_ICON,
    4,
  );
  add_item(
    "super_admin",
    "Administration",
    8,
    "System Users",
    "/system-users",
    USERS_ICON,
    1,
  );
  add_item(
    "super_admin",
    "Administration",
    8,
    "ID Types",
    "/identification-types",
    ID_ICON,
    2,
  );
  add_item(
    "super_admin",
    "Administration",
    8,
    "Genders",
    "/genders",
    GENDERS_ICON,
    3,
  );
  add_item(
    "super_admin",
    "Administration",
    8,
    "Audit Trail",
    "/audit-logs",
    AUDIT_ICON,
    4,
  );

  add_item("org_admin", "Home", 1, "Dashboard", "/", DASHBOARD_ICON, 1);
  add_item("org_admin", "Home", 1, "Calendar", "/calendar", CALENDAR_ICON, 2);
  add_item(
    "org_admin",
    "Home",
    1,
    "Live Games",
    "/live-games",
    LIVE_GAMES_ICON,
    3,
  );
  add_item(
    "org_admin",
    "Home",
    1,
    "Competition Results",
    "/competition-results",
    RESULTS_ICON,
    4,
  );
  add_item("org_admin", "Organization", 2, "Venues", "/venues", VENUES_ICON, 1);
  add_item(
    "org_admin",
    "Competitions",
    3,
    "Competitions",
    "/competitions",
    COMPETITIONS_ICON,
    1,
  );
  add_item(
    "org_admin",
    "Competitions",
    3,
    "Competition Formats",
    "/competition-formats",
    FORMATS_ICON,
    2,
  );
  add_item("org_admin", "Teams", 4, "Teams", "/teams", TEAMS_ICON, 1);
  add_item(
    "org_admin",
    "Teams",
    4,
    "Team Profiles",
    "/team-profiles",
    PROFILE_ICON,
    2,
  );
  add_item("org_admin", "Teams", 4, "Team Staff", "/team-staff", STAFF_ICON, 3);
  add_item("org_admin", "Teams", 4, "Staff Roles", "/staff-roles", TAG_ICON, 4);
  add_item("org_admin", "Players", 5, "Players", "/players", PLAYERS_ICON, 1);
  add_item(
    "org_admin",
    "Players",
    5,
    "Player Profiles",
    "/player-profiles",
    PROFILE_ICON,
    2,
  );
  add_item(
    "org_admin",
    "Players",
    5,
    "Player Team Memberships",
    "/player-team-memberships",
    MEMBERSHIP_ICON,
    3,
  );
  add_item(
    "org_admin",
    "Players",
    5,
    "Player Transfers",
    "/player-transfers",
    TRANSFER_ICON,
    4,
  );
  add_item(
    "org_admin",
    "Players",
    5,
    "Player Positions",
    "/player-positions",
    POSITIONS_ICON,
    5,
  );
  add_item(
    "org_admin",
    "Officials",
    6,
    "Officials",
    "/officials",
    OFFICIALS_ICON,
    1,
  );
  add_item(
    "org_admin",
    "Officials",
    6,
    "Official Roles",
    "/official-roles",
    TAG_ICON,
    2,
  );
  add_item(
    "org_admin",
    "Fixtures & Games",
    7,
    "Fixtures",
    "/fixtures",
    CALENDAR_ICON,
    1,
  );
  add_item(
    "org_admin",
    "Fixtures & Games",
    7,
    "Team Lineups",
    "/fixture-lineups",
    LINEUPS_ICON,
    2,
  );
  add_item(
    "org_admin",
    "Fixtures & Games",
    7,
    "Fixture Details Setup",
    "/fixture-details-setup",
    OFFICIALS_ICON,
    3,
  );
  add_item(
    "org_admin",
    "Fixtures & Games",
    7,
    "Game Event Types",
    "/event-types",
    EVENTS_ICON,
    4,
  );
  add_item(
    "org_admin",
    "Administration",
    8,
    "Settings",
    "/settings",
    SETTINGS_ICON,
    1,
  );
  add_item(
    "org_admin",
    "Administration",
    8,
    "ID Types",
    "/identification-types",
    ID_ICON,
    2,
  );
  add_item(
    "org_admin",
    "Administration",
    8,
    "Audit Trail",
    "/audit-logs",
    AUDIT_ICON,
    3,
  );

  add_item("officials_manager", "Home", 1, "Dashboard", "/", DASHBOARD_ICON, 1);
  add_item(
    "officials_manager",
    "Home",
    1,
    "Calendar",
    "/calendar",
    CALENDAR_ICON,
    2,
  );
  add_item(
    "officials_manager",
    "Home",
    1,
    "Live Games",
    "/live-games",
    LIVE_GAMES_ICON,
    3,
  );
  add_item(
    "officials_manager",
    "Home",
    1,
    "Competition Results",
    "/competition-results",
    RESULTS_ICON,
    4,
  );
  add_item(
    "officials_manager",
    "Officials",
    2,
    "Officials",
    "/officials",
    OFFICIALS_ICON,
    1,
  );
  add_item(
    "officials_manager",
    "Officials",
    2,
    "Official Roles",
    "/official-roles",
    TAG_ICON,
    2,
  );
  add_item(
    "officials_manager",
    "Fixtures & Games",
    3,
    "Fixtures",
    "/fixtures",
    CALENDAR_ICON,
    1,
  );
  add_item(
    "officials_manager",
    "Fixtures & Games",
    3,
    "Fixture Details Setup",
    "/fixture-details-setup",
    OFFICIALS_ICON,
    2,
  );

  add_item("team_manager", "Home", 1, "Dashboard", "/", DASHBOARD_ICON, 1);
  add_item(
    "team_manager",
    "Home",
    1,
    "Calendar",
    "/calendar",
    CALENDAR_ICON,
    2,
  );
  add_item(
    "team_manager",
    "Home",
    1,
    "Competition Results",
    "/competition-results",
    RESULTS_ICON,
    3,
  );
  add_item("team_manager", "My Team", 2, "My Team", "/teams", TEAMS_ICON, 1);
  add_item(
    "team_manager",
    "My Team",
    2,
    "My Team Profile",
    "/team-profiles",
    PROFILE_ICON,
    2,
  );
  add_item(
    "team_manager",
    "My Team",
    2,
    "My Team Staff",
    "/team-staff",
    STAFF_ICON,
    3,
  );
  add_item(
    "team_manager",
    "My Team",
    2,
    "My Players",
    "/players",
    USERS_ICON,
    4,
  );
  add_item(
    "team_manager",
    "Fixtures & Games",
    3,
    "Fixtures",
    "/fixtures",
    CALENDAR_ICON,
    1,
  );
  add_item(
    "team_manager",
    "Fixtures & Games",
    3,
    "Team Lineups",
    "/fixture-lineups",
    LINEUPS_ICON,
    2,
  );

  add_item("official", "Home", 1, "Dashboard", "/", DASHBOARD_ICON, 1);
  add_item("official", "Home", 1, "Calendar", "/calendar", CALENDAR_ICON, 2);
  add_item(
    "official",
    "Home",
    1,
    "Live Games",
    "/live-games",
    LIVE_GAMES_ICON,
    3,
  );
  add_item(
    "official",
    "Home",
    1,
    "Competition Results",
    "/competition-results",
    RESULTS_ICON,
    4,
  );
  add_item(
    "official",
    "My Info",
    2,
    "My Official Profile",
    "/officials",
    PROFILE_ICON,
    1,
  );

  add_item("player", "Home", 1, "Dashboard", "/", DASHBOARD_ICON, 1);
  add_item("player", "Home", 1, "Calendar", "/calendar", CALENDAR_ICON, 2);
  add_item(
    "player",
    "Home",
    1,
    "Competition Results",
    "/competition-results",
    RESULTS_ICON,
    3,
  );
  add_item(
    "player",
    "My Info",
    2,
    "My Player Record",
    "/players",
    PLAYERS_ICON,
    1,
  );
  add_item(
    "player",
    "My Info",
    2,
    "My Profile",
    "/player-profiles",
    PROFILE_ICON,
    2,
  );
  add_item(
    "player",
    "My Info",
    2,
    "My Team Memberships",
    "/player-team-memberships",
    TEAMS_ICON,
    3,
  );
  add_item(
    "player",
    "Fixtures",
    3,
    "My Fixtures",
    "/fixtures",
    CALENDAR_ICON,
    1,
  );

  return items;
}

export const seed_permissions = mutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date().toISOString();
    let role_permissions_count = 0;
    let entity_categories_count = 0;
    let menu_items_count = 0;

    const existing_permissions = await ctx.db
      .query("role_permissions")
      .collect();
    for (const perm of existing_permissions) {
      await ctx.db.delete(perm._id);
    }

    const role_permissions = build_role_permissions();
    for (const perm of role_permissions) {
      await ctx.db.insert("role_permissions", {
        ...perm,
        created_at: now,
        updated_at: now,
      });
      role_permissions_count++;
    }

    const existing_categories = await ctx.db
      .query("entity_data_categories")
      .collect();
    for (const cat of existing_categories) {
      await ctx.db.delete(cat._id);
    }

    const entity_categories = build_entity_categories();
    for (const cat of entity_categories) {
      await ctx.db.insert("entity_data_categories", {
        ...cat,
        created_at: now,
        updated_at: now,
      });
      entity_categories_count++;
    }

    const existing_menu_items = await ctx.db
      .query("sidebar_menu_items")
      .collect();
    for (const item of existing_menu_items) {
      await ctx.db.delete(item._id);
    }

    const menu_items = build_sidebar_menu_items();
    for (const item of menu_items) {
      await ctx.db.insert("sidebar_menu_items", {
        ...item,
        created_at: now,
        updated_at: now,
      });
      menu_items_count++;
    }

    return {
      success: true,
      role_permissions_seeded: role_permissions_count,
      entity_categories_seeded: entity_categories_count,
      menu_items_seeded: menu_items_count,
    };
  },
});
