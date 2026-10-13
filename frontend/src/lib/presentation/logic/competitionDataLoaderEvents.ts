export const COMPETITION_DATA_LOADER_EVENTS = {
  COMPETITION_TEAMS_LOADED: "competition_data_loader_competition_teams_loaded",
  COMPETITION_TEAMS_LOAD_FAILED:
    "competition_data_loader_competition_teams_load_failed",
  TEAMS_LOAD_FAILED: "competition_data_loader_teams_load_failed",
  PLAYER_MEMBERSHIP_TEAMS_LOADED:
    "competition_data_loader_player_membership_teams_loaded",
  PLAYER_GENDER_RESOLVED: "competition_data_loader_player_gender_resolved",
  AVAILABLE_PLAYER_TEAMS_LOADED:
    "competition_data_loader_available_player_teams_loaded",
  VENUE_USE_CASES_MISSING: "competition_data_loader_venue_use_cases_missing",
  VENUE_LOAD_FAILED: "competition_data_loader_venue_load_failed",
  VENUE_NAME_RESOLVED: "competition_data_loader_venue_name_resolved",
} as const;
