export const FIXTURE_DETAILS_AUTO_SETUP_LOG_SCOPE = "[FixtureDetailsAutoSetup]";

export const FIXTURE_DETAILS_AUTO_SETUP_EVENT = {
  STARTED: "fixture_details_auto_setup_started",
  LOOKUP_FAILED: "fixture_details_auto_setup_lookup_failed",
  MISSING_DATA: "fixture_details_auto_setup_missing_data",
  CREATE_FAILED: "fixture_details_auto_setup_create_failed",
  CREATED: "fixture_details_auto_setup_created",
} as const;

export const FIXTURE_DETAILS_AUTO_SETUP_LOOKUP = {
  HOME_JERSEYS: "home_jerseys",
  AWAY_JERSEYS: "away_jerseys",
  OFFICIAL_JERSEYS: "official_jerseys",
  OFFICIALS: "officials",
  OFFICIAL_ROLES: "official_roles",
} as const;

export const FIXTURE_DETAILS_AUTO_SETUP_PAGE_SIZE = 100;

export const FIXTURE_DETAILS_AUTO_SETUP_LOOKUP_FAILED_MESSAGE =
  "We could not load the jerseys and officials needed to set up this fixture. Please try again.";

export const FIXTURE_DETAILS_AUTO_SETUP_MESSAGES = {
  missing_home_jersey: (team_id: string): string =>
    `No Jerseys found for Home Team (${team_id})`,
  missing_away_jersey: (team_id: string): string =>
    `No Jerseys found for Away Team (${team_id})`,
  missing_official_jersey: (competition_id: string): string =>
    `No Jerseys found for Officials (competition ${competition_id})`,
  missing_officials: (organization_id: string): string =>
    `No Officials found for Organization (${organization_id})`,
  missing_official_roles: (competition_id: string): string =>
    `No Official Roles found for Competition (${competition_id})`,
} as const;
