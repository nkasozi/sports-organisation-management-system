import {
  ENTITY_STATUS,
  FIXTURE_STATUS,
} from "$lib/core/entities/StatusConstants";

export const DashboardOrganizationScopeStatus = {
  UNSCOPED: "unscoped",
  SCOPED: "scoped",
} as const;

export const DashboardOrganizationCountStatus = {
  CALCULATED: "calculated",
  FIXED: "fixed",
} as const;

export const DashboardStatusClass = {
  ACTIVE: "status-active",
  WARNING: "status-warning",
  INACTIVE: "status-inactive",
} as const;

export type DashboardStatusClass =
  (typeof DashboardStatusClass)[keyof typeof DashboardStatusClass];

const DASHBOARD_UPCOMING_STATUS = "upcoming";
const DASHBOARD_FINISHED_STATUS = "finished";

export const DASHBOARD_STATUS_CLASS_BY_STATUS: Readonly<
  Record<string, DashboardStatusClass>
> = {
  [ENTITY_STATUS.ACTIVE]: DashboardStatusClass.ACTIVE,
  [FIXTURE_STATUS.IN_PROGRESS]: DashboardStatusClass.ACTIVE,
  [DASHBOARD_UPCOMING_STATUS]: DashboardStatusClass.WARNING,
  [FIXTURE_STATUS.SCHEDULED]: DashboardStatusClass.WARNING,
  [FIXTURE_STATUS.COMPLETED]: DashboardStatusClass.INACTIVE,
  [DASHBOARD_FINISHED_STATUS]: DashboardStatusClass.INACTIVE,
};

export const DashboardDisplayLabel = {
  TODAY: "Today",
  TOMORROW: "Tomorrow",
  TIME_PLACEHOLDER: "TBD",
  DATE_LOCALE: "en-US",
} as const;

export const DashboardSource = {
  ORGANIZATIONS: "organizations",
  COMPETITIONS: "competitions",
  TEAMS: "teams",
  PLAYERS: "players",
  FIXTURES: "fixtures",
} as const;

export type DashboardSource =
  (typeof DashboardSource)[keyof typeof DashboardSource];

export const DASHBOARD_EVENT = {
  SOURCE_LOAD_FAILED: "dashboard_source_load_failed",
} as const;
