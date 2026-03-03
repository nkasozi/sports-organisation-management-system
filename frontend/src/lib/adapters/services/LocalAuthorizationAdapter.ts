import type {
  AuthToken,
  UserRole,
} from "$lib/core/interfaces/ports/AuthenticationPort";
import { is_unrestricted_value } from "$lib/core/interfaces/ports/DataAuthorizationPort";
import type {
  AuthorizationPort,
  AuthorizableAction,
  AuthorizationLevel,
  EntityAuthorizationMap,
  SidebarMenuGroup,
  SidebarMenuItem,
  AuthorizationCheckResult,
  FeatureAccess,
} from "$lib/core/interfaces/ports/AuthorizationPort";
import { EventBus } from "$lib/infrastructure/events/EventBus";

type RoleEntityPermissions = Record<AuthorizableAction, AuthorizationLevel>;

type RolePermissionMap = Record<string, RoleEntityPermissions>;

const DEFAULT_PERMISSIONS: RoleEntityPermissions = {
  create: "none",
  edit: "none",
  delete: "none",
  list: "none",
  view: "none",
};

const ANY_LEVEL_PERMISSIONS: RoleEntityPermissions = {
  create: "any",
  edit: "any",
  delete: "any",
  list: "any",
  view: "any",
};

const ORG_LEVEL_PERMISSIONS: RoleEntityPermissions = {
  create: "organization",
  edit: "organization",
  delete: "organization",
  list: "organization",
  view: "organization",
};

const TEAM_LEVEL_PERMISSIONS: RoleEntityPermissions = {
  create: "team",
  edit: "team",
  delete: "team",
  list: "team",
  view: "team",
};

const PLAYER_VIEW_ONLY: RoleEntityPermissions = {
  create: "none",
  edit: "player",
  delete: "none",
  list: "player",
  view: "player",
};

const SUPER_ADMIN_PERMISSIONS: RolePermissionMap = {
  organization: ANY_LEVEL_PERMISSIONS,
  competition: ANY_LEVEL_PERMISSIONS,
  competitionformat: ANY_LEVEL_PERMISSIONS,
  team: ANY_LEVEL_PERMISSIONS,
  teamprofile: ANY_LEVEL_PERMISSIONS,
  teamstaff: ANY_LEVEL_PERMISSIONS,
  teamstaffrole: ANY_LEVEL_PERMISSIONS,
  player: ANY_LEVEL_PERMISSIONS,
  playerprofile: ANY_LEVEL_PERMISSIONS,
  playerposition: ANY_LEVEL_PERMISSIONS,
  playerteammembership: ANY_LEVEL_PERMISSIONS,
  playerteamtransferhistory: ANY_LEVEL_PERMISSIONS,
  official: ANY_LEVEL_PERMISSIONS,
  gameofficialrole: ANY_LEVEL_PERMISSIONS,
  fixture: ANY_LEVEL_PERMISSIONS,
  fixturelineup: ANY_LEVEL_PERMISSIONS,
  fixturedetailssetup: ANY_LEVEL_PERMISSIONS,
  gameeventtype: ANY_LEVEL_PERMISSIONS,
  venue: ANY_LEVEL_PERMISSIONS,
  sport: ANY_LEVEL_PERMISSIONS,
  identificationtype: ANY_LEVEL_PERMISSIONS,
  gender: ANY_LEVEL_PERMISSIONS,
  identification: ANY_LEVEL_PERMISSIONS,
  qualification: ANY_LEVEL_PERMISSIONS,
  systemuser: ANY_LEVEL_PERMISSIONS,
  auditlog: {
    ...ANY_LEVEL_PERMISSIONS,
    create: "none",
    edit: "none",
    delete: "none",
  },
  jerseycolor: ANY_LEVEL_PERMISSIONS,
  profilelink: ANY_LEVEL_PERMISSIONS,
  officialassociatedteam: ANY_LEVEL_PERMISSIONS,
  livegamelog: ANY_LEVEL_PERMISSIONS,
  gameeventlog: ANY_LEVEL_PERMISSIONS,
};

const ORG_ADMIN_PERMISSIONS: RolePermissionMap = {
  organization: {
    create: "none",
    edit: "organization",
    delete: "none",
    list: "organization",
    view: "organization",
  },
  settings: ORG_LEVEL_PERMISSIONS,
  competition: ORG_LEVEL_PERMISSIONS,
  competitionformat: ORG_LEVEL_PERMISSIONS,
  team: ORG_LEVEL_PERMISSIONS,
  teamprofile: ORG_LEVEL_PERMISSIONS,
  teamstaff: ORG_LEVEL_PERMISSIONS,
  teamstaffrole: ORG_LEVEL_PERMISSIONS,
  player: ORG_LEVEL_PERMISSIONS,
  playerprofile: ORG_LEVEL_PERMISSIONS,
  playerposition: ORG_LEVEL_PERMISSIONS,
  playerteammembership: ORG_LEVEL_PERMISSIONS,
  playerteamtransferhistory: ORG_LEVEL_PERMISSIONS,
  official: ORG_LEVEL_PERMISSIONS,
  gameofficialrole: ORG_LEVEL_PERMISSIONS,
  fixture: ORG_LEVEL_PERMISSIONS,
  fixturelineup: ORG_LEVEL_PERMISSIONS,
  fixturedetailssetup: ORG_LEVEL_PERMISSIONS,
  gameeventtype: ORG_LEVEL_PERMISSIONS,
  venue: ORG_LEVEL_PERMISSIONS,
  sport: {
    create: "none",
    edit: "none",
    delete: "none",
    list: "any",
    view: "any",
  },
  identificationtype: {
    create: "none",
    edit: "none",
    delete: "none",
    list: "any",
    view: "any",
  },
  gender: DEFAULT_PERMISSIONS,
  identification: ORG_LEVEL_PERMISSIONS,
  qualification: ORG_LEVEL_PERMISSIONS,
  systemuser: DEFAULT_PERMISSIONS,
  auditlog: {
    create: "none",
    edit: "none",
    delete: "none",
    list: "organization",
    view: "organization",
  },
  jerseycolor: ORG_LEVEL_PERMISSIONS,
  profilelink: ORG_LEVEL_PERMISSIONS,
  officialassociatedteam: ORG_LEVEL_PERMISSIONS,
  livegamelog: ORG_LEVEL_PERMISSIONS,
  gameeventlog: ORG_LEVEL_PERMISSIONS,
};

const OFFICIALS_MANAGER_PERMISSIONS: RolePermissionMap = {
  organization: {
    create: "none",
    edit: "none",
    delete: "none",
    list: "organization",
    view: "organization",
  },
  competition: {
    create: "none",
    edit: "none",
    delete: "none",
    list: "organization",
    view: "organization",
  },
  competitionformat: {
    create: "none",
    edit: "none",
    delete: "none",
    list: "any",
    view: "any",
  },
  team: {
    create: "none",
    edit: "none",
    delete: "none",
    list: "organization",
    view: "organization",
  },
  teamprofile: DEFAULT_PERMISSIONS,
  teamstaff: DEFAULT_PERMISSIONS,
  teamstaffrole: DEFAULT_PERMISSIONS,
  player: {
    create: "none",
    edit: "none",
    delete: "none",
    list: "organization",
    view: "organization",
  },
  playerprofile: DEFAULT_PERMISSIONS,
  playerposition: {
    create: "none",
    edit: "none",
    delete: "none",
    list: "any",
    view: "any",
  },
  playerteammembership: {
    create: "none",
    edit: "none",
    delete: "none",
    list: "organization",
    view: "organization",
  },
  playerteamtransferhistory: DEFAULT_PERMISSIONS,
  official: ANY_LEVEL_PERMISSIONS,
  gameofficialrole: ANY_LEVEL_PERMISSIONS,
  fixture: {
    create: "none",
    edit: "organization",
    delete: "none",
    list: "organization",
    view: "organization",
  },
  fixturelineup: {
    create: "none",
    edit: "none",
    delete: "none",
    list: "organization",
    view: "organization",
  },
  fixturedetailssetup: ORG_LEVEL_PERMISSIONS,
  gameeventtype: {
    create: "none",
    edit: "none",
    delete: "none",
    list: "any",
    view: "any",
  },
  venue: {
    create: "none",
    edit: "none",
    delete: "none",
    list: "organization",
    view: "organization",
  },
  sport: {
    create: "none",
    edit: "none",
    delete: "none",
    list: "any",
    view: "any",
  },
  identificationtype: {
    create: "none",
    edit: "none",
    delete: "none",
    list: "any",
    view: "any",
  },
  gender: DEFAULT_PERMISSIONS,
  identification: DEFAULT_PERMISSIONS,
  qualification: DEFAULT_PERMISSIONS,
  systemuser: DEFAULT_PERMISSIONS,
  auditlog: DEFAULT_PERMISSIONS,
  jerseycolor: {
    create: "none",
    edit: "none",
    delete: "none",
    list: "any",
    view: "any",
  },
  profilelink: DEFAULT_PERMISSIONS,
  officialassociatedteam: ORG_LEVEL_PERMISSIONS,
  livegamelog: ORG_LEVEL_PERMISSIONS,
  gameeventlog: ORG_LEVEL_PERMISSIONS,
};

const TEAM_MANAGER_PERMISSIONS: RolePermissionMap = {
  organization: {
    create: "none",
    edit: "none",
    delete: "none",
    list: "team",
    view: "team",
  },
  competition: {
    create: "none",
    edit: "none",
    delete: "none",
    list: "team",
    view: "team",
  },
  competitionformat: {
    create: "none",
    edit: "none",
    delete: "none",
    list: "any",
    view: "any",
  },
  team: {
    create: "none",
    edit: "team",
    delete: "none",
    list: "team",
    view: "team",
  },
  teamprofile: {
    create: "team",
    edit: "team",
    delete: "none",
    list: "team",
    view: "team",
  },
  teamstaff: TEAM_LEVEL_PERMISSIONS,
  teamstaffrole: {
    create: "none",
    edit: "none",
    delete: "none",
    list: "any",
    view: "any",
  },
  player: {
    create: "team",
    edit: "team",
    delete: "none",
    list: "team",
    view: "team",
  },
  playerprofile: {
    create: "team",
    edit: "team",
    delete: "none",
    list: "team",
    view: "team",
  },
  playerposition: {
    create: "none",
    edit: "none",
    delete: "none",
    list: "any",
    view: "any",
  },
  playerteammembership: {
    create: "team",
    edit: "none",
    delete: "team",
    list: "team",
    view: "team",
  },
  playerteamtransferhistory: {
    create: "team",
    edit: "none",
    delete: "none",
    list: "team",
    view: "team",
  },
  official: {
    create: "none",
    edit: "none",
    delete: "none",
    list: "team",
    view: "team",
  },
  gameofficialrole: {
    create: "none",
    edit: "none",
    delete: "none",
    list: "any",
    view: "any",
  },
  fixture: {
    create: "none",
    edit: "team",
    delete: "none",
    list: "team",
    view: "team",
  },
  fixturelineup: TEAM_LEVEL_PERMISSIONS,
  fixturedetailssetup: {
    create: "none",
    edit: "none",
    delete: "none",
    list: "team",
    view: "team",
  },
  gameeventtype: {
    create: "none",
    edit: "none",
    delete: "none",
    list: "any",
    view: "any",
  },
  venue: {
    create: "none",
    edit: "none",
    delete: "none",
    list: "any",
    view: "any",
  },
  sport: {
    create: "none",
    edit: "none",
    delete: "none",
    list: "any",
    view: "any",
  },
  identificationtype: {
    create: "none",
    edit: "none",
    delete: "none",
    list: "any",
    view: "any",
  },
  gender: DEFAULT_PERMISSIONS,
  identification: TEAM_LEVEL_PERMISSIONS,
  qualification: TEAM_LEVEL_PERMISSIONS,
  systemuser: DEFAULT_PERMISSIONS,
  auditlog: DEFAULT_PERMISSIONS,
  jerseycolor: {
    create: "none",
    edit: "none",
    delete: "none",
    list: "any",
    view: "any",
  },
  profilelink: TEAM_LEVEL_PERMISSIONS,
  officialassociatedteam: {
    create: "none",
    edit: "none",
    delete: "none",
    list: "team",
    view: "team",
  },
  livegamelog: TEAM_LEVEL_PERMISSIONS,
  gameeventlog: TEAM_LEVEL_PERMISSIONS,
};

const OFFICIAL_PERMISSIONS: RolePermissionMap = {
  organization: DEFAULT_PERMISSIONS,
  competition: {
    create: "none",
    edit: "none",
    delete: "none",
    list: "any",
    view: "any",
  },
  competitionformat: DEFAULT_PERMISSIONS,
  team: {
    create: "none",
    edit: "none",
    delete: "none",
    list: "any",
    view: "any",
  },
  teamprofile: DEFAULT_PERMISSIONS,
  teamstaff: DEFAULT_PERMISSIONS,
  teamstaffrole: DEFAULT_PERMISSIONS,
  player: DEFAULT_PERMISSIONS,
  playerprofile: DEFAULT_PERMISSIONS,
  playerposition: {
    create: "none",
    edit: "none",
    delete: "none",
    list: "any",
    view: "any",
  },
  playerteammembership: DEFAULT_PERMISSIONS,
  playerteamtransferhistory: DEFAULT_PERMISSIONS,
  official: {
    create: "none",
    edit: "player",
    delete: "none",
    list: "any",
    view: "any",
  },
  gameofficialrole: {
    create: "none",
    edit: "none",
    delete: "none",
    list: "any",
    view: "any",
  },
  fixture: {
    create: "none",
    edit: "none",
    delete: "none",
    list: "any",
    view: "any",
  },
  fixturelineup: {
    create: "none",
    edit: "none",
    delete: "none",
    list: "any",
    view: "any",
  },
  fixturedetailssetup: DEFAULT_PERMISSIONS,
  gameeventtype: {
    create: "none",
    edit: "none",
    delete: "none",
    list: "any",
    view: "any",
  },
  venue: {
    create: "none",
    edit: "none",
    delete: "none",
    list: "any",
    view: "any",
  },
  sport: DEFAULT_PERMISSIONS,
  identificationtype: DEFAULT_PERMISSIONS,
  gender: DEFAULT_PERMISSIONS,
  identification: DEFAULT_PERMISSIONS,
  qualification: DEFAULT_PERMISSIONS,
  systemuser: DEFAULT_PERMISSIONS,
  auditlog: DEFAULT_PERMISSIONS,
  jerseycolor: DEFAULT_PERMISSIONS,
  profilelink: DEFAULT_PERMISSIONS,
  officialassociatedteam: DEFAULT_PERMISSIONS,
  livegamelog: {
    create: "none",
    edit: "none",
    delete: "none",
    list: "any",
    view: "any",
  },
  gameeventlog: {
    create: "organization",
    edit: "none",
    delete: "none",
    list: "any",
    view: "any",
  },
};

const PLAYER_PERMISSIONS: RolePermissionMap = {
  organization: DEFAULT_PERMISSIONS,
  competition: {
    create: "none",
    edit: "none",
    delete: "none",
    list: "player",
    view: "player",
  },
  competitionformat: DEFAULT_PERMISSIONS,
  team: {
    create: "none",
    edit: "none",
    delete: "none",
    list: "player",
    view: "player",
  },
  teamprofile: {
    create: "none",
    edit: "none",
    delete: "none",
    list: "player",
    view: "player",
  },
  teamstaff: DEFAULT_PERMISSIONS,
  teamstaffrole: DEFAULT_PERMISSIONS,
  player: {
    create: "none",
    edit: "player",
    delete: "none",
    list: "player",
    view: "player",
  },
  playerprofile: {
    create: "player",
    edit: "player",
    delete: "none",
    list: "player",
    view: "player",
  },
  playerposition: {
    create: "none",
    edit: "none",
    delete: "none",
    list: "any",
    view: "any",
  },
  playerteammembership: PLAYER_VIEW_ONLY,
  playerteamtransferhistory: {
    create: "none",
    edit: "none",
    delete: "none",
    list: "player",
    view: "player",
  },
  official: DEFAULT_PERMISSIONS,
  gameofficialrole: DEFAULT_PERMISSIONS,
  fixture: {
    create: "none",
    edit: "none",
    delete: "none",
    list: "player",
    view: "player",
  },
  fixturelineup: {
    create: "none",
    edit: "none",
    delete: "none",
    list: "player",
    view: "player",
  },
  fixturedetailssetup: DEFAULT_PERMISSIONS,
  gameeventtype: DEFAULT_PERMISSIONS,
  venue: DEFAULT_PERMISSIONS,
  sport: DEFAULT_PERMISSIONS,
  identificationtype: DEFAULT_PERMISSIONS,
  gender: DEFAULT_PERMISSIONS,
  identification: {
    create: "player",
    edit: "player",
    delete: "none",
    list: "player",
    view: "player",
  },
  qualification: {
    create: "player",
    edit: "player",
    delete: "none",
    list: "player",
    view: "player",
  },
  systemuser: DEFAULT_PERMISSIONS,
  auditlog: DEFAULT_PERMISSIONS,
  jerseycolor: DEFAULT_PERMISSIONS,
  profilelink: {
    create: "player",
    edit: "player",
    delete: "player",
    list: "player",
    view: "player",
  },
  officialassociatedteam: DEFAULT_PERMISSIONS,
  livegamelog: {
    create: "none",
    edit: "none",
    delete: "none",
    list: "player",
    view: "player",
  },
  gameeventlog: {
    create: "none",
    edit: "none",
    delete: "none",
    list: "player",
    view: "player",
  },
};

const ROLE_PERMISSION_MAPS: Record<UserRole, RolePermissionMap> = {
  super_admin: SUPER_ADMIN_PERMISSIONS,
  org_admin: ORG_ADMIN_PERMISSIONS,
  officials_manager: OFFICIALS_MANAGER_PERMISSIONS,
  team_manager: TEAM_MANAGER_PERMISSIONS,
  official: OFFICIAL_PERMISSIONS,
  player: PLAYER_PERMISSIONS,
};

const SUPER_ADMIN_MENU: SidebarMenuGroup[] = [
  {
    group_name: "Home",
    items: [
      {
        name: "Dashboard",
        href: "/",
        icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
      },
      {
        name: "Calendar",
        href: "/calendar",
        icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
      },
      {
        name: "Live Games",
        href: "/live-games",
        icon: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      },
      {
        name: "Competition Results",
        href: "/competition-results",
        icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
      },
      {
        name: "Help",
        href: "/help",
        icon: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      },
    ],
  },
  {
    group_name: "Organization",
    items: [
      {
        name: "Organizations",
        href: "/organizations",
        icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
      },
      {
        name: "Sports",
        href: "/sports",
        icon: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      },
      {
        name: "Venues",
        href: "/venues",
        icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z",
      },
    ],
  },
  {
    group_name: "Competitions",
    items: [
      {
        name: "Competitions",
        href: "/competitions",
        icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
      },
      {
        name: "Competition Formats",
        href: "/competition-formats",
        icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
      },
    ],
  },
  {
    group_name: "Teams",
    items: [
      {
        name: "Teams",
        href: "/teams",
        icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
      },
      {
        name: "Team Profiles",
        href: "/team-profiles",
        icon: "M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z",
      },
      {
        name: "Team Staff",
        href: "/team-staff",
        icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
      },
      {
        name: "Staff Roles",
        href: "/staff-roles",
        icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
      },
    ],
  },
  {
    group_name: "Players",
    items: [
      {
        name: "Players",
        href: "/players",
        icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
      },
      {
        name: "Player Profiles",
        href: "/player-profiles",
        icon: "M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z",
      },
      {
        name: "Player Team Memberships",
        href: "/player-team-memberships",
        icon: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z",
      },
      {
        name: "Player Transfers",
        href: "/player-transfers",
        icon: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4",
      },
      {
        name: "Player Positions",
        href: "/player-positions",
        icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
      },
    ],
  },
  {
    group_name: "Officials",
    items: [
      {
        name: "Officials",
        href: "/officials",
        icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
      },
      {
        name: "Official Roles",
        href: "/official-roles",
        icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
      },
    ],
  },
  {
    group_name: "Fixtures & Games",
    items: [
      {
        name: "Fixtures",
        href: "/fixtures",
        icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
      },
      {
        name: "Team Lineups",
        href: "/fixture-lineups",
        icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
      },
      {
        name: "Fixture Details Setup",
        href: "/fixture-details-setup",
        icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
      },
      {
        name: "Game Event Types",
        href: "/event-types",
        icon: "M13 10V3L4 14h7v7l9-11h-7z",
      },
    ],
  },
  {
    group_name: "Administration",
    items: [
      {
        name: "System Users",
        href: "/system-users",
        icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
      },
      {
        name: "ID Types",
        href: "/identification-types",
        icon: "M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2",
      },
      {
        name: "Genders",
        href: "/genders",
        icon: "M7 8a5 5 0 1110 0 5 5 0 01-10 0zm10 0v4m0 0h4m-4 0l-2 2m-6 2a4 4 0 108 0 4 4 0 00-8 0z",
      },
      {
        name: "Audit Trail",
        href: "/audit-logs",
        icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
      },
    ],
  },
];

const ORG_ADMIN_MENU: SidebarMenuGroup[] = [
  {
    group_name: "Home",
    items: [
      {
        name: "Dashboard",
        href: "/",
        icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
      },
      {
        name: "Calendar",
        href: "/calendar",
        icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
      },
      {
        name: "Live Games",
        href: "/live-games",
        icon: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      },
      {
        name: "Competition Results",
        href: "/competition-results",
        icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
      },
    ],
  },
  {
    group_name: "Organization",
    items: [
      {
        name: "Venues",
        href: "/venues",
        icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z",
      },
    ],
  },
  {
    group_name: "Competitions",
    items: [
      {
        name: "Competitions",
        href: "/competitions",
        icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
      },
      {
        name: "Competition Formats",
        href: "/competition-formats",
        icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
      },
    ],
  },
  {
    group_name: "Teams",
    items: [
      {
        name: "Teams",
        href: "/teams",
        icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
      },
      {
        name: "Team Profiles",
        href: "/team-profiles",
        icon: "M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z",
      },
      {
        name: "Team Staff",
        href: "/team-staff",
        icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
      },
      {
        name: "Staff Roles",
        href: "/staff-roles",
        icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
      },
    ],
  },
  {
    group_name: "Players",
    items: [
      {
        name: "Players",
        href: "/players",
        icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
      },
      {
        name: "Player Profiles",
        href: "/player-profiles",
        icon: "M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z",
      },
      {
        name: "Player Team Memberships",
        href: "/player-team-memberships",
        icon: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z",
      },
      {
        name: "Player Transfers",
        href: "/player-transfers",
        icon: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4",
      },
      {
        name: "Player Positions",
        href: "/player-positions",
        icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
      },
    ],
  },
  {
    group_name: "Officials",
    items: [
      {
        name: "Officials",
        href: "/officials",
        icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
      },
      {
        name: "Official Roles",
        href: "/official-roles",
        icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
      },
    ],
  },
  {
    group_name: "Fixtures & Games",
    items: [
      {
        name: "Fixtures",
        href: "/fixtures",
        icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
      },
      {
        name: "Team Lineups",
        href: "/fixture-lineups",
        icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
      },
      {
        name: "Fixture Details Setup",
        href: "/fixture-details-setup",
        icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
      },
      {
        name: "Game Event Types",
        href: "/event-types",
        icon: "M13 10V3L4 14h7v7l9-11h-7z",
      },
    ],
  },
  {
    group_name: "Administration",
    items: [
      {
        name: "Settings",
        href: "/settings",
        icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
      },
      {
        name: "ID Types",
        href: "/identification-types",
        icon: "M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2",
      },
      {
        name: "Audit Trail",
        href: "/audit-logs",
        icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
      },
    ],
  },
];

const OFFICIALS_MANAGER_MENU: SidebarMenuGroup[] = [
  {
    group_name: "Home",
    items: [
      {
        name: "Dashboard",
        href: "/",
        icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
      },
      {
        name: "Calendar",
        href: "/calendar",
        icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
      },
      {
        name: "Live Games",
        href: "/live-games",
        icon: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      },
      {
        name: "Competition Results",
        href: "/competition-results",
        icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
      },
    ],
  },
  {
    group_name: "Officials",
    items: [
      {
        name: "Officials",
        href: "/officials",
        icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
      },
      {
        name: "Official Roles",
        href: "/official-roles",
        icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
      },
    ],
  },
  {
    group_name: "Fixtures & Games",
    items: [
      {
        name: "Fixtures",
        href: "/fixtures",
        icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
      },
      {
        name: "Fixture Details Setup",
        href: "/fixture-details-setup",
        icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
      },
    ],
  },
];

const TEAM_MANAGER_MENU: SidebarMenuGroup[] = [
  {
    group_name: "Home",
    items: [
      {
        name: "Dashboard",
        href: "/",
        icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
      },
      {
        name: "Calendar",
        href: "/calendar",
        icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
      },
      {
        name: "Competition Results",
        href: "/competition-results",
        icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
      },
    ],
  },
  {
    group_name: "My Team",
    items: [
      {
        name: "My Team",
        href: "/teams",
        icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
      },
      {
        name: "Team Profile",
        href: "/team-profiles",
        icon: "M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z",
      },
      {
        name: "Team Staff",
        href: "/team-staff",
        icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
      },
      {
        name: "Players",
        href: "/players",
        icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
      },
    ],
  },
  {
    group_name: "Fixtures & Games",
    items: [
      {
        name: "Fixtures",
        href: "/fixtures",
        icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
      },
      {
        name: "Team Lineups",
        href: "/fixture-lineups",
        icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
      },
    ],
  },
];

const PLAYER_MENU: SidebarMenuGroup[] = [
  {
    group_name: "Home",
    items: [
      {
        name: "Dashboard",
        href: "/",
        icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
      },
      {
        name: "Calendar",
        href: "/calendar",
        icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
      },
      {
        name: "Competition Results",
        href: "/competition-results",
        icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
      },
    ],
  },
  {
    group_name: "My Info",
    items: [
      {
        name: "My Player Record",
        href: "/players",
        icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
      },
      {
        name: "My Profile",
        href: "/player-profiles",
        icon: "M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z",
      },
      {
        name: "My Team Memberships",
        href: "/player-team-memberships",
        icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
      },
    ],
  },
  {
    group_name: "Fixtures",
    items: [
      {
        name: "My Fixtures",
        href: "/fixtures",
        icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
      },
    ],
  },
];

const OFFICIAL_MENU: SidebarMenuGroup[] = [
  {
    group_name: "Home",
    items: [
      {
        name: "Dashboard",
        href: "/",
        icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
      },
      {
        name: "Calendar",
        href: "/calendar",
        icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
      },
      {
        name: "Live Games",
        href: "/live-games",
        icon: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      },
      {
        name: "Competition Results",
        href: "/competition-results",
        icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
      },
    ],
  },
];

const ROLE_MENUS: Record<UserRole, SidebarMenuGroup[]> = {
  super_admin: SUPER_ADMIN_MENU,
  org_admin: ORG_ADMIN_MENU,
  officials_manager: OFFICIALS_MANAGER_MENU,
  team_manager: TEAM_MANAGER_MENU,
  official: OFFICIAL_MENU,
  player: PLAYER_MENU,
};

const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  super_admin: "Super Admin",
  org_admin: "Organisation Admin",
  officials_manager: "Officials Manager",
  team_manager: "Team Manager",
  official: "Official",
  player: "Player",
};

function extract_route_base(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return "/";
  return "/" + segments[0];
}

function get_all_routes_from_menu(menu: SidebarMenuGroup[]): Set<string> {
  const routes = new Set<string>();
  for (const group of menu) {
    for (const item of group.items) {
      routes.add(item.href);
      const base = extract_route_base(item.href);
      if (base !== item.href) {
        routes.add(base);
      }
    }
  }
  return routes;
}

export function get_allowed_routes_for_role(role: UserRole): Set<string> {
  const menu = ROLE_MENUS[role] || PLAYER_MENU;
  return get_all_routes_from_menu(menu);
}

export function get_sidebar_menu_for_role(role: UserRole): SidebarMenuGroup[] {
  return ROLE_MENUS[role] || PLAYER_MENU;
}

export function can_role_access_route(
  role: UserRole,
  pathname: string,
): { allowed: boolean; reason: string } {
  if (pathname === "/" || pathname === "") {
    return { allowed: true, reason: "" };
  }

  const allowed_routes = get_allowed_routes_for_role(role);
  const route_base = extract_route_base(pathname);

  if (allowed_routes.has(pathname) || allowed_routes.has(route_base)) {
    return { allowed: true, reason: "" };
  }

  const role_display = ROLE_DISPLAY_NAMES[role] || role;
  const denial_reason = `Your role (${role_display}) does not have access to this page.`;

  EventBus.emit_access_denied(
    "route",
    pathname,
    "access",
    "navigation",
    denial_reason,
    role,
    "route_access_check",
  );

  return {
    allowed: false,
    reason: denial_reason,
  };
}

export class LocalAuthorizationAdapter implements AuthorizationPort {
  get_sidebar_menu_items(token: AuthToken): SidebarMenuGroup[] {
    const role = token.payload.role;
    const menu_items = ROLE_MENUS[role] || PLAYER_MENU;

    console.log(
      `[LocalAuthorizationAdapter] Getting sidebar menu items for role: ${role}, returned ${menu_items.length} groups`,
    );

    return menu_items;
  }

  get_user_authorization_level(
    token: AuthToken,
    entity_type: string,
  ): EntityAuthorizationMap {
    const role = token.payload.role;
    const normalized_entity_type = entity_type
      .toLowerCase()
      .replace(/\s+/g, "");
    const role_permissions = ROLE_PERMISSION_MAPS[role] || {};
    const entity_permissions =
      role_permissions[normalized_entity_type] || DEFAULT_PERMISSIONS;

    const authorizations = new Map<AuthorizableAction, AuthorizationLevel>();
    const actions: AuthorizableAction[] = [
      "create",
      "edit",
      "delete",
      "list",
      "view",
    ];

    for (const action of actions) {
      authorizations.set(action, entity_permissions[action] || "none");
    }

    console.log(
      `[LocalAuthorizationAdapter] Authorization levels for role: ${role}, entity: ${normalized_entity_type}`,
      Object.fromEntries(authorizations),
    );

    return {
      entity_type: normalized_entity_type,
      authorizations,
    };
  }

  is_authorized_to_execute(
    token: AuthToken,
    action: AuthorizableAction,
    entity_type: string,
    entity_id?: string,
    target_organization_id?: string,
    target_team_id?: string,
  ): AuthorizationCheckResult {
    const role = token.payload.role;
    const user_org_id = token.payload.organization_id;
    const user_team_id = token.payload.team_id;

    const authorization_map = this.get_user_authorization_level(
      token,
      entity_type,
    );
    const authorization_level =
      authorization_map.authorizations.get(action) || "none";

    if (authorization_level === "none") {
      const error_message = this.get_authorization_error_message(
        role,
        action,
        entity_type,
      );
      console.warn(
        `[LocalAuthorizationAdapter] Authorization DENIED: ${role} cannot ${action} ${entity_type}. ${error_message}`,
      );
      return {
        is_authorized: false,
        authorization_level: "none",
        error_message,
      };
    }

    if (authorization_level === "any") {
      console.log(
        `[LocalAuthorizationAdapter] Authorization GRANTED: ${role} can ${action} any ${entity_type}`,
      );
      return {
        is_authorized: true,
        authorization_level: "any",
      };
    }

    if (authorization_level === "organization") {
      if (is_unrestricted_value(user_org_id)) {
        console.log(
          `[LocalAuthorizationAdapter] Authorization GRANTED: ${role} has org-level access with wildcard`,
        );
        return {
          is_authorized: true,
          authorization_level: "organization",
          restricted_to_organization_id: user_org_id,
        };
      }

      if (target_organization_id && target_organization_id !== user_org_id) {
        const error_message = `You can only ${action} ${entity_type} within your organization.`;
        console.warn(
          `[LocalAuthorizationAdapter] Authorization DENIED: ${role} org ${user_org_id} cannot ${action} ${entity_type} in org ${target_organization_id}`,
        );
        return {
          is_authorized: false,
          authorization_level: "organization",
          error_message,
          restricted_to_organization_id: user_org_id,
        };
      }

      console.log(
        `[LocalAuthorizationAdapter] Authorization GRANTED: ${role} can ${action} ${entity_type} in org ${user_org_id}`,
      );
      return {
        is_authorized: true,
        authorization_level: "organization",
        restricted_to_organization_id: user_org_id,
      };
    }

    if (authorization_level === "team") {
      if (is_unrestricted_value(user_team_id)) {
        console.log(
          `[LocalAuthorizationAdapter] Authorization GRANTED: ${role} has team-level access with wildcard`,
        );
        return {
          is_authorized: true,
          authorization_level: "team",
          restricted_to_team_id: user_team_id,
        };
      }

      if (target_team_id && target_team_id !== user_team_id) {
        const error_message = `You can only ${action} ${entity_type} for your team.`;
        console.warn(
          `[LocalAuthorizationAdapter] Authorization DENIED: ${role} team ${user_team_id} cannot ${action} ${entity_type} for team ${target_team_id}`,
        );
        return {
          is_authorized: false,
          authorization_level: "team",
          error_message,
          restricted_to_team_id: user_team_id,
        };
      }

      console.log(
        `[LocalAuthorizationAdapter] Authorization GRANTED: ${role} can ${action} ${entity_type} for team ${user_team_id}`,
      );
      return {
        is_authorized: true,
        authorization_level: "team",
        restricted_to_team_id: user_team_id,
      };
    }

    if (authorization_level === "player") {
      console.log(
        `[LocalAuthorizationAdapter] Authorization GRANTED: ${role} can ${action} own ${entity_type}`,
      );
      return {
        is_authorized: true,
        authorization_level: "player",
        restricted_to_organization_id: user_org_id,
        restricted_to_team_id: user_team_id,
      };
    }

    console.warn(
      `[LocalAuthorizationAdapter] Authorization DENIED: Unknown authorization level ${authorization_level}`,
    );
    return {
      is_authorized: false,
      authorization_level: "none",
      error_message: "Unknown authorization level",
    };
  }

  get_feature_access(token: AuthToken): FeatureAccess {
    const role = token.payload.role;

    const feature_access: FeatureAccess = {
      can_reset_demo: role === "super_admin" || role === "org_admin",
      can_view_audit_logs: role === "super_admin" || role === "org_admin",
      can_access_dashboard: true,
      audit_logs_scope:
        role === "super_admin"
          ? "any"
          : role === "org_admin"
            ? "organization"
            : "none",
    };

    console.log(
      `[LocalAuthorizationAdapter] Feature access for role ${role}:`,
      feature_access,
    );

    return feature_access;
  }

  get_authorization_error_message(
    role: UserRole,
    action: AuthorizableAction,
    entity_type: string,
  ): string {
    const role_display = ROLE_DISPLAY_NAMES[role] || role;
    const action_display = action.charAt(0).toUpperCase() + action.slice(1);
    const entity_display = this.format_entity_type_for_display(entity_type);

    return `${action_display} ${entity_display} is not permitted for the ${role_display} role. Please contact your administrator if you believe you should have access to this feature.`;
  }

  private format_entity_type_for_display(entity_type: string): string {
    const known_entity_names: Record<string, string> = {
      systemuser: "System User",
      organization: "Organization",
      competition: "Competition",
      competitionformat: "Competition Format",
      team: "Team",
      teamprofile: "Team Profile",
      teamstaff: "Team Staff",
      teamstaffrole: "Team Staff Role",
      player: "Player",
      playerprofile: "Player Profile",
      playerposition: "Player Position",
      playerteammembership: "Player Team Membership",
      playerteamtransferhistory: "Player Team Transfer History",
      official: "Official",
      gameofficialrole: "Game Official Role",
      fixture: "Fixture",
      fixturelineup: "Fixture Lineup",
      fixturedetailssetup: "Fixture Details Setup",
      gameeventtype: "Game Event Type",
      venue: "Venue",
      sport: "Sport",
      identificationtype: "Identification Type",
      gender: "Gender",
      identification: "Identification",
      qualification: "Qualification",
      auditlog: "Audit Log",
      jerseycolor: "Jersey Color",
      profilelink: "Profile Link",
      officialassociatedteam: "Official Associated Team",
      livegamelog: "Live Game Log",
      gameeventlog: "Game Event Log",
    };

    const normalized_type = entity_type.toLowerCase().replace(/[\s_]/g, "");

    if (known_entity_names[normalized_type]) {
      return known_entity_names[normalized_type];
    }

    return entity_type
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/_/g, " ")
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }
}

let authorization_adapter_instance: LocalAuthorizationAdapter | null = null;

export function get_authorization_adapter(): LocalAuthorizationAdapter {
  if (!authorization_adapter_instance) {
    authorization_adapter_instance = new LocalAuthorizationAdapter();
  }
  return authorization_adapter_instance;
}
