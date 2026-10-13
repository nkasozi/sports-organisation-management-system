import {
  check_condition,
  collect_validation_errors,
  is_blank_text,
} from "./EntityValidation";
import type { CreateFixtureInput } from "./FixtureTypes";

const FIXTURE_VALIDATION_MESSAGES = {
  COMPETITION_REQUIRED: "Competition is required",
  HOME_TEAM_REQUIRED: "Home team is required",
  AWAY_TEAM_REQUIRED: "Away team is required",
  TEAMS_MUST_DIFFER: "Home and away teams must be different",
  SCHEDULED_DATE_REQUIRED: "Scheduled date is required",
  SCHEDULED_TIME_REQUIRED: "Scheduled time is required",
  ROUND_NUMBER_INVALID: "Round number must be at least 1",
  STAGE_REQUIRED: "Stage is required",
} as const;

const MINIMUM_ROUND_NUMBER = 1;

export function validate_fixture_input(input: CreateFixtureInput): string[] {
  const has_both_teams =
    Boolean(input.home_team_id) && Boolean(input.away_team_id);
  return collect_validation_errors([
    check_condition(
      Boolean(input.competition_id),
      FIXTURE_VALIDATION_MESSAGES.COMPETITION_REQUIRED,
    ),
    check_condition(
      Boolean(input.home_team_id),
      FIXTURE_VALIDATION_MESSAGES.HOME_TEAM_REQUIRED,
    ),
    check_condition(
      Boolean(input.away_team_id),
      FIXTURE_VALIDATION_MESSAGES.AWAY_TEAM_REQUIRED,
    ),
    check_condition(
      !has_both_teams || input.home_team_id !== input.away_team_id,
      FIXTURE_VALIDATION_MESSAGES.TEAMS_MUST_DIFFER,
    ),
    check_condition(
      Boolean(input.scheduled_date),
      FIXTURE_VALIDATION_MESSAGES.SCHEDULED_DATE_REQUIRED,
    ),
    check_condition(
      Boolean(input.scheduled_time),
      FIXTURE_VALIDATION_MESSAGES.SCHEDULED_TIME_REQUIRED,
    ),
    check_condition(
      input.round_number >= MINIMUM_ROUND_NUMBER,
      FIXTURE_VALIDATION_MESSAGES.ROUND_NUMBER_INVALID,
    ),
    check_condition(
      !is_blank_text(input.stage_id),
      FIXTURE_VALIDATION_MESSAGES.STAGE_REQUIRED,
    ),
  ]);
}
