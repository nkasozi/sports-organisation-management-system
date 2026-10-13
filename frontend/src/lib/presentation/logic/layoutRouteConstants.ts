export const APP_ROUTE_PATH = {
  HOME: "/",
  SIGN_IN: "/sign-in",
  UNAUTHORIZED: "/unauthorized",
  API_PREFIX: "/api/",
  PRIVACY: "/privacy",
  TERMS: "/terms",
  CONTACT: "/contact",
  PLAYER_PROFILE_PREFIX: "/profile/",
  TEAM_PROFILE_PREFIX: "/team-profile/",
  COMPETITION_RESULTS: "/competition-results",
  CALENDAR: "/calendar",
  MATCH_REPORT: "/match-report",
} as const;

export const ROUTE_GUARD_EXEMPT_EXACT_PATHS: ReadonlySet<string> = new Set([
  APP_ROUTE_PATH.HOME,
  APP_ROUTE_PATH.UNAUTHORIZED,
  APP_ROUTE_PATH.PRIVACY,
  APP_ROUTE_PATH.TERMS,
  APP_ROUTE_PATH.CONTACT,
]);
