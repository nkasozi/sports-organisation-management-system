import {
  get_competition_use_cases,
  get_fixture_lineup_use_cases,
  get_fixture_use_cases,
  get_official_use_cases,
  get_organization_use_cases,
  get_sport_use_cases,
  get_team_staff_use_cases,
  get_team_use_cases,
  get_venue_use_cases,
} from "$lib/infrastructure/registry/useCaseFactories";

export const match_report_page_dependencies = {
  fixture_use_cases: get_fixture_use_cases(),
  team_use_cases: get_team_use_cases(),
  fixture_lineup_use_cases: get_fixture_lineup_use_cases(),
  competition_use_cases: get_competition_use_cases(),
  organization_use_cases: get_organization_use_cases(),
  sport_use_cases: get_sport_use_cases(),
  venue_use_cases: get_venue_use_cases(),
  official_use_cases: get_official_use_cases(),
  team_staff_use_cases: get_team_staff_use_cases(),
};
