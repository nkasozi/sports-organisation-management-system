import type { FixtureStatus } from "./FixtureTypes";
import type { EntityStatus } from "./BaseEntity";
import type { StageType } from "./CompetitionStage";
import type { LiveGameStatus } from "./LiveGameLog";
import type { PlayerTeamMembershipStatus } from "./PlayerTeamMembership";

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
