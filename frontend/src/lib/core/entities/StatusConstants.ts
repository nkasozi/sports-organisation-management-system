import type { FixtureStatus } from "./FixtureTypes";
import type { GamePeriod } from "./FixtureTypes";
import type { EntityStatus } from "./BaseEntity";
import type { StageType } from "./CompetitionStage";
import type { LiveGameStatus } from "./LiveGameLog";
import type { PlayerTeamMembershipStatus } from "./PlayerTeamMembership";
import type { LineupStatus } from "./FixtureLineup";
import type { PlayerTeamTransferStatus } from "./PlayerTeamTransferHistory";
import type { FixtureDetailsSetupConfirmationStatus } from "./FixtureDetailsSetup";
import type { FormatType } from "./CompetitionFormatTypes";
import type { UserRole } from "../interfaces/ports/external/iam/AuthenticationPort";

export const FIXTURE_STATUS: Record<string, FixtureStatus> = {
  SCHEDULED: "scheduled",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  POSTPONED: "postponed",
  CANCELLED: "cancelled",
} as const;

export const ENTITY_STATUS: Record<string, EntityStatus> = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  ARCHIVED: "archived",
  PENDING: "pending",
  DELETED: "deleted",
} as const;

export const STAGE_TYPE: Record<string, StageType> = {
  GROUP_STAGE: "group_stage",
  KNOCKOUT_STAGE: "knockout_stage",
  LEAGUE_STAGE: "league_stage",
  ONE_OFF_STAGE: "one_off_stage",
  CUSTOM: "custom",
} as const;

export const GAME_STATUS: Record<string, LiveGameStatus> = {
  PRE_GAME: "pre_game",
  IN_PROGRESS: "in_progress",
  PAUSED: "paused",
  COMPLETED: "completed",
  ABANDONED: "abandoned",
} as const;

export const FIELD_TYPE = {
  STRING: "string",
  NUMBER: "number",
  STAR_RATING: "star_rating",
  BOOLEAN: "boolean",
  DATE: "date",
  ENUM: "enum",
  FOREIGN_KEY: "foreign_key",
  FILE: "file",
  SUB_ENTITY: "sub_entity",
  OFFICIAL_ASSIGNMENT_ARRAY: "official_assignment_array",
  STAGE_TEMPLATE_ARRAY: "stage_template_array",
} as const;

export const ACTIVITY_SOURCE_TYPE = {
  MANUAL: "manual",
} as const;

export const MEMBERSHIP_STATUS: Record<string, PlayerTeamMembershipStatus> = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  ENDED: "ended",
} as const;

export const USER_ROLE: Record<string, UserRole> = {
  SUPER_ADMIN: "super_admin",
  ORG_ADMIN: "org_admin",
  OFFICIALS_MANAGER: "officials_manager",
  TEAM_MANAGER: "team_manager",
  OFFICIAL: "official",
  PLAYER: "player",
  PUBLIC_VIEWER: "public_viewer",
} as const;

export const WILDCARD_SCOPE = "*" as const;

export const GAME_PERIOD: Record<string, GamePeriod> = {
  PRE_GAME: "pre_game",
  FIRST_HALF: "first_half",
  HALF_TIME: "half_time",
  SECOND_HALF: "second_half",
  EXTRA_TIME_FIRST: "extra_time_first",
  EXTRA_TIME_SECOND: "extra_time_second",
  PENALTY_SHOOTOUT: "penalty_shootout",
  FINISHED: "finished",
} as const;

export const LINEUP_STATUS: Record<string, LineupStatus> = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  LOCKED: "locked",
} as const;

export const TRANSFER_STATUS: Record<string, PlayerTeamTransferStatus> = {
  PENDING: "pending",
  APPROVED: "approved",
  DECLINED: "declined",
} as const;

export const CONFIRMATION_STATUS: Record<
  string,
  FixtureDetailsSetupConfirmationStatus
> = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  DECLINED: "declined",
  REPLACED: "replaced",
} as const;

export const FORMAT_TYPE: Record<string, FormatType> = {
  LEAGUE: "league",
  ROUND_ROBIN: "round_robin",
  GROUPS_KNOCKOUT: "groups_knockout",
  STRAIGHT_KNOCKOUT: "straight_knockout",
  GROUPS_PLAYOFFS: "groups_playoffs",
  DOUBLE_ELIMINATION: "double_elimination",
  SWISS: "swiss",
  CUSTOM: "custom",
} as const;
