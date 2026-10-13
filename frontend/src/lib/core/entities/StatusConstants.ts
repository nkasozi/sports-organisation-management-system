export const FIXTURE_STATUS = {
  SCHEDULED: "scheduled",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  POSTPONED: "postponed",
  CANCELLED: "cancelled",
} as const;

export const ENTITY_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  ARCHIVED: "archived",
  PENDING: "pending",
  DELETED: "deleted",
} as const;

export const STAGE_TYPE = {
  GROUP_STAGE: "group_stage",
  KNOCKOUT_STAGE: "knockout_stage",
  LEAGUE_STAGE: "league_stage",
  ONE_OFF_STAGE: "one_off_stage",
  CUSTOM: "custom",
} as const;

export const GAME_STATUS = {
  PRE_GAME: "pre_game",
  IN_PROGRESS: "in_progress",
  PAUSED: "paused",
  COMPLETED: "completed",
  ABANDONED: "abandoned",
} as const;

export const ACTIVITY_SOURCE_TYPE = {
  MANUAL: "manual",
  COMPETITION: "competition",
  FIXTURE: "fixture",
} as const;

export const MEMBERSHIP_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  ENDED: "ended",
} as const;

export const WILDCARD_SCOPE = "*" as const;

export const GAME_PERIOD = {
  PRE_GAME: "pre_game",
  FIRST_HALF: "first_half",
  HALF_TIME: "half_time",
  SECOND_HALF: "second_half",
  EXTRA_TIME_FIRST: "extra_time_first",
  EXTRA_TIME_SECOND: "extra_time_second",
  PENALTY_SHOOTOUT: "penalty_shootout",
  FINISHED: "finished",
} as const;

export const LINEUP_STATUS = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  LOCKED: "locked",
} as const;

export const TRANSFER_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  DECLINED: "declined",
} as const;

export const CONFIRMATION_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  DECLINED: "declined",
  REPLACED: "replaced",
} as const;

export const FORMAT_TYPE = {
  LEAGUE: "league",
  ROUND_ROBIN: "round_robin",
  GROUPS_KNOCKOUT: "groups_knockout",
  STRAIGHT_KNOCKOUT: "straight_knockout",
  GROUPS_PLAYOFFS: "groups_playoffs",
  DOUBLE_ELIMINATION: "double_elimination",
  SWISS: "swiss",
  CUSTOM: "custom",
} as const;

type ValueOf<T> = T[keyof T];

export type FixtureStatusValue = ValueOf<typeof FIXTURE_STATUS>;
export type EntityStatusValue = ValueOf<typeof ENTITY_STATUS>;
export type StageTypeValue = ValueOf<typeof STAGE_TYPE>;
export type GameStatusValue = ValueOf<typeof GAME_STATUS>;
export type MembershipStatusValue = ValueOf<typeof MEMBERSHIP_STATUS>;
export type GamePeriodValue = ValueOf<typeof GAME_PERIOD>;
export type LineupStatusValue = ValueOf<typeof LINEUP_STATUS>;
export type TransferStatusValue = ValueOf<typeof TRANSFER_STATUS>;
export type ConfirmationStatusValue = ValueOf<typeof CONFIRMATION_STATUS>;
export type FormatTypeValue = ValueOf<typeof FORMAT_TYPE>;
