import type {
  AuthenticationPort,
  UserRole,
  SystemUserRepository,
} from "$lib/core/interfaces/ports";
import type {
  AuthorizationPort,
  SidebarMenuGroup,
  SidebarMenuItem,
  DataCategory,
  CategoryPermissions,
  ProfilePermissions,
  AuthorizationFailure,
  RouteAccessGranted,
  RouteAccessDenied,
  DataAction,
  EntityAuthorizationResult,
} from "$lib/core/interfaces/ports";
import {
  get_entity_data_category,
  check_data_permission,
  get_role_permissions,
  normalize_to_entity_type,
} from "$lib/core/interfaces/ports";
import type { Result, AsyncResult } from "$lib/core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "$lib/core/types/Result";
import { EventBus } from "$lib/infrastructure/events/EventBus";
import {
  create_auth_cache,
  type AuthCache,
} from "$lib/infrastructure/cache/AuthCache";

const AUTHORIZATION_CACHE_MAX_ENTRIES = 200;
const AUTHORIZATION_CACHE_TTL_MS = 30 * 60 * 1000;

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
        name: "Assign Fixture Officials & Colors",
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
        name: "Assign Fixture Officials & Colors",
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
        name: "Assign Fixture Officials & Colors",
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
        name: "My Team Staff",
        href: "/team-staff",
        icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
      },
      {
        name: "My Players",
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
  {
    group_name: "My Info",
    items: [
      {
        name: "My Official Profile",
        href: "/officials",
        icon: "M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z",
      },
    ],
  },
];

const PUBLIC_VIEWER_MENU: SidebarMenuGroup[] = [
  {
    group_name: "Home",
    items: [
      {
        name: "Competition Results",
        href: "/competition-results",
        icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
      },
      {
        name: "Calendar",
        href: "/calendar",
        icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
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
  public_viewer: PUBLIC_VIEWER_MENU,
};

const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  super_admin: "Super Admin",
  org_admin: "Organisation Admin",
  officials_manager: "Officials Manager",
  team_manager: "Team Manager",
  official: "Official",
  player: "Player",
  public_viewer: "Public Viewer",
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

const ALWAYS_ALLOWED_ROUTE_BASES: Set<string> = new Set(["/", "/match-report"]);

export function can_role_access_route(
  role: UserRole,
  pathname: string,
): { allowed: boolean; reason: string } {
  if (pathname === "/" || pathname === "") {
    return { allowed: true, reason: "" };
  }

  const route_base = extract_route_base(pathname);
  if (ALWAYS_ALLOWED_ROUTE_BASES.has(route_base)) {
    return { allowed: true, reason: "" };
  }

  const allowed_routes = get_allowed_routes_for_role(role);

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
  private auth_port: AuthenticationPort;
  private system_user_repository: SystemUserRepository;
  private authorization_cache: AuthCache<unknown>;

  constructor(
    auth_port: AuthenticationPort,
    system_user_repository: SystemUserRepository,
    authorization_cache?: AuthCache<unknown>,
  ) {
    this.auth_port = auth_port;
    this.system_user_repository = system_user_repository;
    this.authorization_cache =
      authorization_cache ??
      create_auth_cache<unknown>({
        max_entries: AUTHORIZATION_CACHE_MAX_ENTRIES,
        fallback_ttl_ms: AUTHORIZATION_CACHE_TTL_MS,
      });
  }

  get_authorization_cache(): AuthCache<unknown> {
    return this.authorization_cache;
  }

  private build_cache_key(...parts: string[]): string {
    return parts.join(":");
  }

  private async get_role_for_email(email: string): Promise<UserRole | null> {
    const user_result = await this.system_user_repository.find_by_email(email);

    if (!user_result.success || user_result.data.items.length === 0) {
      console.warn(
        `[LocalAuthorizationAdapter] User not found for email: ${email}`,
      );
      return null;
    }

    const system_user = user_result.data.items[0];

    if (system_user.status === "inactive") {
      console.warn(
        `[LocalAuthorizationAdapter] User account is inactive: ${email}`,
      );
      return null;
    }

    return system_user.role as UserRole;
  }

  async get_profile_permissions(
    raw_token: string,
  ): AsyncResult<ProfilePermissions, AuthorizationFailure> {
    const cache_key = this.build_cache_key("profile_permissions", raw_token);
    const cached = this.authorization_cache.get_or_miss(cache_key);
    if (cached.is_hit && cached.value) {
      console.log(
        "[LocalAuthorizationAdapter] Cache HIT for profile permissions",
      );
      return cached.value as Result<ProfilePermissions, AuthorizationFailure>;
    }

    const verification_result = await this.auth_port.verify_token(raw_token);

    if (!verification_result.success) {
      return create_failure_result({
        failure_type: "token_invalid",
        message: verification_result.error,
      });
    }

    const verification = verification_result.data;

    if (!verification.is_valid || !verification.payload) {
      const is_expired = verification.error_message?.includes("expired");
      return create_failure_result({
        failure_type: is_expired ? "token_expired" : "token_invalid",
        message: verification.error_message || "Token verification failed",
      });
    }

    const role = await this.get_role_for_email(verification.payload.email);

    if (!role) {
      return create_failure_result({
        failure_type: "token_invalid",
        message: "User not found or account is inactive",
      });
    }

    const role_permissions = get_role_permissions(role);

    const categories: DataCategory[] = [
      "root_level",
      "org_administrator_level",
      "organisation_level",
      "team_level",
      "player_level",
      "public_level",
    ];

    const permissions: Record<DataCategory, CategoryPermissions> = {} as Record<
      DataCategory,
      CategoryPermissions
    >;

    for (const category of categories) {
      permissions[category] = role_permissions[category];
    }

    console.log(
      `[LocalAuthorizationAdapter] Retrieved permissions for role: ${role}`,
    );

    const result = create_success_result({
      role,
      permissions,
    });
    this.authorization_cache.set(cache_key, result);
    return result;
  }

  async get_sidebar_menu_for_profile(
    raw_token: string,
  ): AsyncResult<SidebarMenuGroup[], AuthorizationFailure> {
    const cache_key = this.build_cache_key("sidebar_menu", raw_token);
    const cached = this.authorization_cache.get_or_miss(cache_key);
    if (cached.is_hit && cached.value) {
      console.log("[LocalAuthorizationAdapter] Cache HIT for sidebar menu");
      return cached.value as Result<SidebarMenuGroup[], AuthorizationFailure>;
    }

    const verification_result = await this.auth_port.verify_token(raw_token);

    if (!verification_result.success) {
      console.warn(
        "[LocalAuthorizationAdapter] Token verification failed for sidebar menu",
      );
      return create_failure_result({
        failure_type: "token_invalid",
        message: verification_result.error,
      });
    }

    const verification = verification_result.data;

    if (!verification.is_valid || !verification.payload) {
      const is_expired = verification.error_message?.includes("expired");
      console.warn(
        "[LocalAuthorizationAdapter] Invalid token for sidebar menu",
      );
      return create_failure_result({
        failure_type: is_expired ? "token_expired" : "token_invalid",
        message: verification.error_message || "Token verification failed",
      });
    }

    const role = await this.get_role_for_email(verification.payload.email);

    if (!role) {
      return create_failure_result({
        failure_type: "token_invalid",
        message: "User not found or account is inactive",
      });
    }

    const menu_items = get_sidebar_menu_for_role(role);

    console.log(
      `[LocalAuthorizationAdapter] Getting sidebar menu for role: ${role}, returned ${menu_items.length} groups`,
    );

    const result = create_success_result(menu_items);
    this.authorization_cache.set(cache_key, result);
    return result;
  }

  async can_profile_access_route(
    raw_token: string,
    route: string,
  ): AsyncResult<RouteAccessGranted, RouteAccessDenied> {
    const cache_key = this.build_cache_key("route_access", raw_token, route);
    const cached = this.authorization_cache.get_or_miss(cache_key);
    if (cached.is_hit && cached.value) {
      return cached.value as Result<RouteAccessGranted, RouteAccessDenied>;
    }

    const verification_result = await this.auth_port.verify_token(raw_token);

    if (!verification_result.success) {
      return create_failure_result({
        route,
        message: verification_result.error,
      });
    }

    const verification = verification_result.data;

    if (!verification.is_valid || !verification.payload) {
      return create_failure_result({
        route,
        message: "Invalid or expired authentication token",
      });
    }

    const role = await this.get_role_for_email(verification.payload.email);

    if (!role) {
      return create_failure_result({
        route,
        message: "User not found or account is inactive",
      });
    }

    const access_check = can_role_access_route(role, route);

    if (!access_check.allowed) {
      return create_failure_result({
        route,
        message: access_check.reason,
      });
    }

    const all_accessible_routes = get_sidebar_menu_for_role(role);
    const result = create_success_result({ route, all_accessible_routes });
    this.authorization_cache.set(cache_key, result);
    return result;
  }

  async check_entity_authorized(
    raw_token: string,
    entity_type: string,
    action: DataAction,
  ): AsyncResult<EntityAuthorizationResult> {
    const cache_key = this.build_cache_key(
      "entity_auth",
      raw_token,
      entity_type,
      action,
    );
    const cached = this.authorization_cache.get_or_miss(cache_key);
    if (cached.is_hit && cached.value) {
      return create_success_result(cached.value as EntityAuthorizationResult);
    }

    const verification_result = await this.auth_port.verify_token(raw_token);

    if (!verification_result.success) {
      return create_success_result({
        is_authorized: false,
        failure_reason: "token_invalid" as const,
        reason: verification_result.error,
      });
    }

    const verification = verification_result.data;

    if (!verification.is_valid || !verification.payload) {
      const is_expired = verification.error_message?.includes("expired");
      return create_success_result({
        is_authorized: false,
        failure_reason: is_expired
          ? ("token_expired" as const)
          : ("token_invalid" as const),
        reason: verification.error_message || "Token verification failed",
      });
    }

    const role = await this.get_role_for_email(verification.payload.email);

    if (!role) {
      return create_success_result({
        is_authorized: false,
        failure_reason: "token_invalid" as const,
        reason: "User not found or account is inactive",
      });
    }

    const normalized = normalize_to_entity_type(entity_type);
    const category = get_entity_data_category(normalized);
    const is_authorized = check_data_permission(role, category, action);

    if (!is_authorized) {
      const denial_reason = `Role "${role}" does not have "${action}" permission for ${entity_type} (${category} data)`;

      EventBus.emit_access_denied(
        entity_type,
        "*",
        action,
        category,
        denial_reason,
        role,
      );

      return create_success_result(
        this.cache_entity_authorization_result(cache_key, {
          is_authorized: false,
          failure_reason: "permission_denied",
          data_category: category,
          role,
          reason: denial_reason,
        }),
      );
    }

    return create_success_result(
      this.cache_entity_authorization_result(cache_key, {
        is_authorized: true,
        data_category: category,
        role,
      }),
    );
  }

  private cache_entity_authorization_result(
    cache_key: string,
    result: EntityAuthorizationResult,
  ): EntityAuthorizationResult {
    this.authorization_cache.set(cache_key, result);
    return result;
  }

  async get_allowed_entity_actions(
    raw_token: string,
    entity_type: string,
  ): AsyncResult<DataAction[]> {
    const cache_key = this.build_cache_key(
      "allowed_actions",
      raw_token,
      entity_type,
    );
    const cached = this.authorization_cache.get_or_miss(cache_key);
    if (cached.is_hit && cached.value) {
      return create_success_result(cached.value as DataAction[]);
    }

    const verification_result = await this.auth_port.verify_token(raw_token);

    if (
      !verification_result.success ||
      !verification_result.data.is_valid ||
      !verification_result.data.payload
    ) {
      return create_success_result([]);
    }

    const role = await this.get_role_for_email(
      verification_result.data.payload.email,
    );

    if (!role) {
      return create_success_result([]);
    }

    const normalized_allowed = normalize_to_entity_type(entity_type);
    const category = get_entity_data_category(normalized_allowed);
    const permissions = get_role_permissions(role)[category];

    const allowed_actions: DataAction[] = [];
    if (permissions.create) allowed_actions.push("create");
    if (permissions.read) allowed_actions.push("read");
    if (permissions.update) allowed_actions.push("update");
    if (permissions.delete) allowed_actions.push("delete");

    this.authorization_cache.set(cache_key, allowed_actions);
    return create_success_result(allowed_actions);
  }

  async get_disabled_entity_actions(
    raw_token: string,
    entity_type: string,
  ): AsyncResult<DataAction[]> {
    const cache_key = this.build_cache_key(
      "disabled_actions",
      raw_token,
      entity_type,
    );
    const cached = this.authorization_cache.get_or_miss(cache_key);
    if (cached.is_hit && cached.value) {
      return create_success_result(cached.value as DataAction[]);
    }

    const verification_result = await this.auth_port.verify_token(raw_token);

    if (
      !verification_result.success ||
      !verification_result.data.is_valid ||
      !verification_result.data.payload
    ) {
      return create_success_result([
        "create",
        "read",
        "update",
        "delete",
      ] as DataAction[]);
    }

    const role = await this.get_role_for_email(
      verification_result.data.payload.email,
    );

    if (!role) {
      return create_success_result([
        "create",
        "read",
        "update",
        "delete",
      ] as DataAction[]);
    }

    const normalized_disabled = normalize_to_entity_type(entity_type);
    const category = get_entity_data_category(normalized_disabled);
    const permissions = get_role_permissions(role)[category];

    const disabled: DataAction[] = [];
    if (!permissions.create) disabled.push("create");
    if (!permissions.read) disabled.push("read");
    if (!permissions.update) disabled.push("update");
    if (!permissions.delete) disabled.push("delete");

    this.authorization_cache.set(cache_key, disabled);
    return create_success_result(disabled);
  }

  async get_sidebar_menu_for_role(
    role: UserRole,
  ): AsyncResult<SidebarMenuGroup[]> {
    const menu_items = get_sidebar_menu_for_role(role);
    return create_success_result(menu_items);
  }

  async get_accessible_routes_for_role(role: UserRole): AsyncResult<string[]> {
    const allowed_routes = get_allowed_routes_for_role(role);
    return create_success_result(Array.from(allowed_routes));
  }
}
