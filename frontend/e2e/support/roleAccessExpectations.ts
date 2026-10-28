import { type E2eRole } from "./profiles";
import { E2E_WORLD } from "./world";

const CALENDAR = /Activities Calendar$/;

function first_name_of(full_name: string): string {
  return full_name.split(" ")[0];
}

export interface ScopedList {
  link: string;
  shows: string[];
  hides: string[];
}

export interface RoleAccess {
  role_label: string;
  sees: Array<string | RegExp>;
  blocked_routes: string[];
  scoped_lists?: ScopedList[];
}

const SHARED_HOME = ["Dashboard", CALENDAR, "Competition Results"];

const ORG_ADMIN_AREAS = [
  "Venues",
  "Competitions",
  "Competition Formats",
  "Teams",
  "Team Staff",
  "Staff Roles",
  "Players",
  "Player Team Memberships",
  "Player Transfers",
  "Player Positions",
  "Officials",
  "Official Roles",
  "Officials Performance",
  "Officials Leaderboard",
  "Fixtures",
  "Team Lineups",
  "Assign Fixture Officials & Colors",
  "Game Event Types",
  "Settings",
  "ID Types",
  "Audit Trail",
];

export const EXPECTED_ACCESS: Record<E2eRole, RoleAccess> = {
  super_admin: {
    role_label: "All Organisations",
    sees: [
      ...SHARED_HOME,
      ...ORG_ADMIN_AREAS,
      "Live Games",
      "Help",
      "How It Works",
      "Organizations",
      "Sports",
      "Genders",
      "System Users",
    ],
    blocked_routes: [],
  },
  org_admin: {
    role_label: "E2E Hockey League",
    sees: [...SHARED_HOME, ...ORG_ADMIN_AREAS, "Live Games", "How It Works"],
    blocked_routes: ["/organizations", "/sports"],
  },
  officials_manager: {
    role_label: "E2E Hockey League",
    sees: [
      ...SHARED_HOME,
      "Live Games",
      "How It Works",
      "Officials",
      "Official Roles",
      "Officials Performance",
      "Officials Leaderboard",
      "Fixtures",
      "Assign Fixture Officials & Colors",
    ],
    blocked_routes: ["/teams", "/players", "/audit-logs", "/system-users"],
  },
  team_manager: {
    role_label: "E2E Hockey League",
    sees: [
      ...SHARED_HOME,
      "How It Works",
      "My Team",
      "My Team Staff",
      "My Players",
      "Fixtures",
      "Team Lineups",
      "Officials Performance",
    ],
    blocked_routes: ["/officials", "/audit-logs", "/fixture-details-setup"],
    scoped_lists: [
      {
        link: "My Players",
        shows: E2E_WORLD.home_players.map(first_name_of),
        hides: E2E_WORLD.away_players.map(first_name_of),
      },
    ],
  },
  table_official: {
    role_label: "E2E Hockey League",
    sees: [...SHARED_HOME, "Live Games", "How It Works", "My Official Profile"],
    blocked_routes: ["/fixtures", "/teams", "/audit-logs"],
    scoped_lists: [
      {
        link: "My Official Profile",
        shows: ["Grace"],
        hides: ["Peter"],
      },
    ],
  },
  field_official: {
    role_label: "E2E Hockey League",
    sees: [...SHARED_HOME, "Live Games", "How It Works", "My Official Profile"],
    blocked_routes: ["/fixtures", "/teams", "/audit-logs"],
    scoped_lists: [
      {
        link: "My Official Profile",
        shows: ["Peter"],
        hides: ["Grace"],
      },
    ],
  },
  player: {
    role_label: "E2E Hockey League",
    sees: [
      ...SHARED_HOME,
      "How It Works",
      "My Player Record",
      "My Team Memberships",
      "My Fixtures",
    ],
    blocked_routes: ["/teams", "/officials", "/audit-logs"],
    scoped_lists: [
      {
        link: "My Player Record",
        shows: ["Robert"],
        hides: ["Allan", "Daniel"],
      },
    ],
  },
};
