import {
  get_competition_format_use_cases,
  get_competition_stage_use_cases,
  get_competition_team_use_cases,
  get_competition_use_cases,
  get_fixture_use_cases,
  get_organization_use_cases,
  get_team_use_cases,
} from "$lib/infrastructure/registry/useCaseFactories";

export const competition_results_page_dependencies = {
  organization_use_cases: get_organization_use_cases(),
  competition_use_cases: get_competition_use_cases(),
  format_use_cases: get_competition_format_use_cases(),
  competition_stage_use_cases: get_competition_stage_use_cases(),
  competition_team_use_cases: get_competition_team_use_cases(),
  team_use_cases: get_team_use_cases(),
  fixture_use_cases: get_fixture_use_cases(),
};
