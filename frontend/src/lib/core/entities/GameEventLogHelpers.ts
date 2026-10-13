import {
  check_condition,
  collect_validation_errors,
  is_blank_text,
} from "./EntityValidation";
import {
  type CreateGameEventLogInput,
  GAME_EVENT_LOG_TYPE,
  type GameEventLogType,
  TEAM_SIDE,
  type TeamSide,
  type UpdateGameEventLogInput,
} from "./GameEventLogTypes";
import { ENTITY_STATUS } from "./StatusConstants";

type GameEventLogValidationInput =
  | CreateGameEventLogInput
  | UpdateGameEventLogInput;

const MINIMUM_EVENT_MINUTE = 0;
const MAXIMUM_EVENT_MINUTE = 200;
const NUMBER_TYPE_NAME = "number";

const GAME_EVENT_LOG_MESSAGES = {
  ORGANIZATION_REQUIRED: "Organization is required",
  LIVE_GAME_LOG_REQUIRED: "Live game log is required",
  FIXTURE_REQUIRED: "Fixture is required",
  EVENT_TYPE_REQUIRED: "Event type is required",
  MINUTE_NEGATIVE: "Minute cannot be negative",
  MINUTE_TOO_HIGH: "Minute value is too high",
  INVALID_TEAM_SIDE: "Invalid team side",
} as const;

const GAME_EVENT_LOG_TYPE_LABELS: Readonly<Record<GameEventLogType, string>> = {
  goal: "Goal",
  own_goal: "Own Goal",
  penalty_scored: "Penalty Scored",
  penalty_missed: "Penalty Missed",
  yellow_card: "Yellow Card",
  green_card: "Green Card",
  red_card: "Red Card",
  second_yellow: "Second Yellow",
  substitution: "Substitution",
  foul: "Foul",
  offside: "Offside",
  corner: "Corner",
  free_kick: "Free Kick",
  injury: "Injury",
  var_review: "VAR Review",
  period_start: "Period Start",
  period_end: "Period End",
};

const TEAM_SIDE_LABELS: Readonly<Record<TeamSide, string>> = {
  home: "Home",
  away: "Away",
  match: "Match",
};

const SCORING_EVENT_TYPES: ReadonlySet<GameEventLogType> = new Set([
  GAME_EVENT_LOG_TYPE.GOAL,
  GAME_EVENT_LOG_TYPE.OWN_GOAL,
  GAME_EVENT_LOG_TYPE.PENALTY_SCORED,
]);

const CARD_EVENT_TYPES: ReadonlySet<GameEventLogType> = new Set([
  GAME_EVENT_LOG_TYPE.YELLOW_CARD,
  GAME_EVENT_LOG_TYPE.GREEN_CARD,
  GAME_EVENT_LOG_TYPE.RED_CARD,
  GAME_EVENT_LOG_TYPE.SECOND_YELLOW,
]);

const VALID_TEAM_SIDES: ReadonlySet<string> = new Set(Object.values(TEAM_SIDE));

export function create_empty_game_event_log_input(
  organization_id: CreateGameEventLogInput["organization_id"] = "",
  live_game_log_id: CreateGameEventLogInput["live_game_log_id"] = "",
  fixture_id: CreateGameEventLogInput["fixture_id"] = "",
): CreateGameEventLogInput {
  return {
    organization_id,
    live_game_log_id,
    fixture_id,
    event_type: GAME_EVENT_LOG_TYPE.GOAL,
    minute: 0,
    stoppage_time_minute: 0,
    team_side: TEAM_SIDE.HOME,
    player_id: "",
    player_name: "",
    secondary_player_id: "",
    secondary_player_name: "",
    description: "",
    affects_score: false,
    score_change_home: 0,
    score_change_away: 0,
    recorded_by_user_id: "",
    status: ENTITY_STATUS.ACTIVE,
  };
}

export function validate_game_event_log_input(
  input: GameEventLogValidationInput,
): { is_valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {
    ...collect_reference_errors(input),
    ...collect_minute_errors(input),
    ...collect_team_side_errors(input),
  };
  return { is_valid: Object.keys(errors).length === 0, errors };
}

function collect_reference_errors(
  input: GameEventLogValidationInput,
): Record<string, string> {
  const errors: Record<string, string> = {};
  if ("organization_id" in input && is_blank_text(input.organization_id)) {
    errors.organization_id = GAME_EVENT_LOG_MESSAGES.ORGANIZATION_REQUIRED;
  }
  if ("live_game_log_id" in input && is_blank_text(input.live_game_log_id)) {
    errors.live_game_log_id = GAME_EVENT_LOG_MESSAGES.LIVE_GAME_LOG_REQUIRED;
  }
  if ("fixture_id" in input && is_blank_text(input.fixture_id)) {
    errors.fixture_id = GAME_EVENT_LOG_MESSAGES.FIXTURE_REQUIRED;
  }
  if ("event_type" in input && is_blank_text(input.event_type)) {
    errors.event_type = GAME_EVENT_LOG_MESSAGES.EVENT_TYPE_REQUIRED;
  }
  return errors;
}

function collect_minute_errors(
  input: GameEventLogValidationInput,
): Record<string, string> {
  if (!("minute" in input) || typeof input.minute !== NUMBER_TYPE_NAME) {
    return {};
  }
  const minute = Number(input.minute);
  const too_high = check_condition(
    minute <= MAXIMUM_EVENT_MINUTE,
    GAME_EVENT_LOG_MESSAGES.MINUTE_TOO_HIGH,
  );
  const negative = check_condition(
    minute >= MINIMUM_EVENT_MINUTE,
    GAME_EVENT_LOG_MESSAGES.MINUTE_NEGATIVE,
  );
  const minute_errors = collect_validation_errors([negative, too_high]);
  return minute_errors.length > 0 ? { minute: minute_errors[0] } : {};
}

function collect_team_side_errors(
  input: GameEventLogValidationInput,
): Record<string, string> {
  if (!("team_side" in input) || !input.team_side) {
    return {};
  }
  return VALID_TEAM_SIDES.has(input.team_side)
    ? {}
    : { team_side: GAME_EVENT_LOG_MESSAGES.INVALID_TEAM_SIDE };
}

export function is_scoring_event(event_type: GameEventLogType): boolean {
  return SCORING_EVENT_TYPES.has(event_type);
}

export function is_card_event(event_type: GameEventLogType): boolean {
  return CARD_EVENT_TYPES.has(event_type);
}

export const GAME_EVENT_TYPE_OPTIONS: {
  value: GameEventLogType;
  label: string;
}[] = Object.values(GAME_EVENT_LOG_TYPE).map((value) => ({
  value,
  label: GAME_EVENT_LOG_TYPE_LABELS[value],
}));

export const TEAM_SIDE_OPTIONS: { value: TeamSide; label: string }[] =
  Object.values(TEAM_SIDE).map((value) => ({
    value,
    label: TEAM_SIDE_LABELS[value],
  }));
