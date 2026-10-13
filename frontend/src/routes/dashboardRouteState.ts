import type { Result } from "$lib/core/types/Result";
import type { DashboardData } from "$lib/presentation/logic/dashboardPageTypes";

export const DASHBOARD_ROUTE_STATUS = {
  LOADING: "loading",
  READY: "ready",
  FAILED: "failed",
} as const;

export const DASHBOARD_ROUTE_MESSAGES = {
  LOAD_FAILED_TITLE: "Unable to Load Dashboard",
  LOAD_FAILED:
    "We couldn't load your dashboard right now. Please check your connection and try again.",
  RESET_FAILED:
    "We couldn't reset the demo data. Your existing data is unchanged. Please try again.",
  RESET_STARTED: "Clearing demo data...",
  RESET_TITLE: "Resetting Demo Data",
} as const;

export const DASHBOARD_HOME_ROUTE_PATH = "/";
export const DASHBOARD_FALLBACK_ROLE = "player";

const DASHBOARD_LOAD_FAILED_EVENT = "dashboard_load_failed";

export type DashboardRouteState =
  | { status: typeof DASHBOARD_ROUTE_STATUS.LOADING; data: DashboardData }
  | { status: typeof DASHBOARD_ROUTE_STATUS.READY; data: DashboardData }
  | { status: typeof DASHBOARD_ROUTE_STATUS.FAILED; message: string };

export const EMPTY_DASHBOARD_DATA: DashboardData = {
  stats: { organizations: 0, competitions: 0, teams: 0, players: 0 },
  recent_competitions: [],
  upcoming_fixtures: [],
  teams_map: new Map(),
  competition_names: {},
  sport_names: {},
  competition_sport_names: {},
};

export function dashboard_data_of(state: DashboardRouteState): DashboardData {
  switch (state.status) {
    case DASHBOARD_ROUTE_STATUS.LOADING:
    case DASHBOARD_ROUTE_STATUS.READY:
      return state.data;
    case DASHBOARD_ROUTE_STATUS.FAILED:
      return EMPTY_DASHBOARD_DATA;
  }
}

export function begin_dashboard_load(
  state: DashboardRouteState,
): DashboardRouteState {
  return {
    status: DASHBOARD_ROUTE_STATUS.LOADING,
    data: dashboard_data_of(state),
  };
}

export function settle_dashboard_load(
  result: Result<DashboardData>,
): DashboardRouteState {
  if (result.success)
    return { status: DASHBOARD_ROUTE_STATUS.READY, data: result.data };
  console.error("[Dashboard] Failed to load dashboard data", {
    event: DASHBOARD_LOAD_FAILED_EVENT,
    error: result.error,
  });
  return {
    status: DASHBOARD_ROUTE_STATUS.FAILED,
    message: DASHBOARD_ROUTE_MESSAGES.LOAD_FAILED,
  };
}

export function fail_dashboard(message: string): DashboardRouteState {
  return { status: DASHBOARD_ROUTE_STATUS.FAILED, message };
}
