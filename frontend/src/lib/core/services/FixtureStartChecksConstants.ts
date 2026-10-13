export const CHECK_STATUS = {
  PENDING: "pending",
  CHECKING: "checking",
  PASSED: "passed",
  FAILED: "failed",
} as const;

export const FIXTURE_START_CHECK_NAME = {
  OFFICIALS: "officials",
  HOME_LINEUP: "home_lineup",
  AWAY_LINEUP: "away_lineup",
} as const;

export const FIXTURE_START_CHECKS_LOG_SCOPE = "[FixtureStartChecks]";

export const FIXTURE_START_CHECKS_EVENT = {
  STARTED: "fixture_start_check_started",
  MISSING_FIXTURE_ID: "fixture_start_check_missing_fixture_id",
  OFFICIALS_LOOKUP_FAILED: "fixture_start_check_officials_lookup_failed",
  LINEUPS_LOOKUP_FAILED: "fixture_start_check_lineups_lookup_failed",
  COMPLETED: "fixture_start_check_completed",
} as const;

export const FIXTURE_START_CHECKS_MESSAGES = {
  MISSING_FIXTURE_ID: "Fixture must have an ID",
  OFFICIALS_LOOKUP_FAILED:
    "We could not load the officials for this fixture. Please try again.",
  LINEUPS_LOOKUP_FAILED:
    "We could not load the team lineups for this fixture. Please try again.",
  NO_OFFICIALS: "No officials assigned to this fixture",
  NO_OFFICIALS_FIX:
    "Go to the Fixture Details Setup page and assign officials, team jerseys and official jerseys for this fixture",
  LINEUP_NOT_SUBMITTED_FIX: "Submit the lineup in Team Fixture Lineups page",
  HOME_TEAM_LABEL: "Home",
  AWAY_TEAM_LABEL: "Away",
  officials_assigned: (count: number): string =>
    `${count} official(s) assigned`,
  lineup_submitted: (team_label: string, player_count: number): string =>
    `${team_label} team lineup submitted with ${player_count} players`,
  lineup_not_submitted: (team_label: string, status: string): string =>
    `${team_label} team lineup exists but not submitted (status: ${status})`,
  lineup_missing: (team_label: string): string =>
    `No ${team_label.toLowerCase()} team lineup found`,
} as const;
