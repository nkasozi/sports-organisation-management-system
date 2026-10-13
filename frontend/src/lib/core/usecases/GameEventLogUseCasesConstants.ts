import type { GameEventLogType, TeamSide } from "../entities/GameEventLog";
import { ENTITY_STATUS } from "../entities/StatusConstants";

export const GAME_EVENT_LOG_USE_CASES_LOG_SCOPE = "[GameEventLogUseCases]";

export const GAME_EVENT_LOG_ENTITY_TYPE = "gameeventlog";

export const GAME_EVENT_LOG_DEFAULT_EVENT_LABEL = "Event";

export const GAME_EVENT_LOG_VOIDED_CHANGED_FIELDS = [
  "voided",
  "void_reason",
  "voided_by_user_id",
];

export const GameEventLogUseCaseEvent = {
  CREATE_LIVE_GAME_LOG_ID_MISSING:
    "game_event_log_create_live_game_log_id_missing",
  CREATE_FIXTURE_ID_MISSING: "game_event_log_create_fixture_id_missing",
  CREATE_ORGANIZATION_ID_MISSING:
    "game_event_log_create_organization_id_missing",
  CREATE_EVENT_TYPE_MISSING: "game_event_log_create_event_type_missing",
  CREATE_FAILED: "game_event_log_create_failed",
  GET_ID_MISSING: "game_event_log_get_id_missing",
  GET_FAILED: "game_event_log_get_failed",
  UPDATE_ID_MISSING: "game_event_log_update_id_missing",
  UPDATE_TARGET_NOT_FOUND: "game_event_log_update_target_not_found",
  UPDATE_TARGET_VOIDED: "game_event_log_update_target_voided",
  UPDATE_FAILED: "game_event_log_update_failed",
  DELETE_ID_MISSING: "game_event_log_delete_id_missing",
  DELETE_TARGET_NOT_FOUND: "game_event_log_delete_target_not_found",
  DELETE_FAILED: "game_event_log_delete_failed",
  LIST_FAILED: "game_event_log_list_failed",
  LIVE_GAME_EVENTS_ID_MISSING: "game_event_log_live_game_events_id_missing",
  LIVE_GAME_EVENTS_FAILED: "game_event_log_live_game_events_failed",
  FIXTURE_EVENTS_ID_MISSING: "game_event_log_fixture_events_id_missing",
  FIXTURE_EVENTS_FAILED: "game_event_log_fixture_events_failed",
  PLAYER_EVENTS_ID_MISSING: "game_event_log_player_events_id_missing",
  PLAYER_EVENTS_FAILED: "game_event_log_player_events_failed",
  SCORING_EVENTS_ID_MISSING: "game_event_log_scoring_events_id_missing",
  SCORING_EVENTS_FAILED: "game_event_log_scoring_events_failed",
  CARD_EVENTS_ID_MISSING: "game_event_log_card_events_id_missing",
  CARD_EVENTS_FAILED: "game_event_log_card_events_failed",
  VOID_ID_MISSING: "game_event_log_void_id_missing",
  VOID_REASON_MISSING: "game_event_log_void_reason_missing",
  VOID_TARGET_NOT_FOUND: "game_event_log_void_target_not_found",
  VOID_TARGET_ALREADY_VOIDED: "game_event_log_void_target_already_voided",
  VOID_FAILED: "game_event_log_void_failed",
  RECORD_GOAL_FAILED: "game_event_log_record_goal_failed",
  RECORD_CARD_FAILED: "game_event_log_record_card_failed",
  RECORD_SUBSTITUTION_FAILED: "game_event_log_record_substitution_failed",
} as const;

export const GameEventLogUseCaseMessage = {
  ID_REQUIRED: "GameEventLog ID is required",
  LIVE_GAME_LOG_ID_REQUIRED: "Live game log ID is required",
  FIXTURE_ID_REQUIRED: "Fixture ID is required",
  ORGANIZATION_ID_REQUIRED: "Organization ID is required",
  EVENT_TYPE_REQUIRED: "Event type is required",
  PLAYER_ID_REQUIRED: "Player ID is required",
  VOID_REASON_REQUIRED: "Void reason is required",
  NOT_FOUND: "Game event log not found",
  CANNOT_UPDATE_VOIDED: "Cannot update a voided event",
  ALREADY_VOIDED: "Event is already voided",
} as const;

const GameEventTeamSide = {
  HOME: "home",
  AWAY: "away",
  MATCH: "match",
} as const satisfies Record<string, TeamSide>;

export const GameEventRecorderEventType = {
  GOAL: "goal",
  SUBSTITUTION: "substitution",
} as const satisfies Record<string, GameEventLogType>;

export const GAME_EVENT_CARD_TYPE_LABELS = new Map<string, string>([
  ["yellow_card", "Yellow card"],
  ["red_card", "Red card"],
  ["second_yellow", "Second yellow card"],
  ["green_card", "Green card"],
]);

type RecordingTeamSide = Exclude<TeamSide, typeof GameEventTeamSide.MATCH>;

interface GameEventScoreChange {
  affects_score: boolean;
  score_change_home: number;
  score_change_away: number;
}

export const NO_SCORE_CHANGE: GameEventScoreChange = {
  affects_score: false,
  score_change_home: 0,
  score_change_away: 0,
};

export const GOAL_SCORE_CHANGE_BY_SIDE: Record<
  RecordingTeamSide,
  GameEventScoreChange
> = {
  [GameEventTeamSide.HOME]: {
    affects_score: true,
    score_change_home: 1,
    score_change_away: 0,
  },
  [GameEventTeamSide.AWAY]: {
    affects_score: true,
    score_change_home: 0,
    score_change_away: 1,
  },
};

export const RECORDED_EVENT_DEFAULTS = {
  stoppage_time_minute: 0,
  secondary_player_id: "",
  secondary_player_name: "",
  status: ENTITY_STATUS.ACTIVE,
} as const;
