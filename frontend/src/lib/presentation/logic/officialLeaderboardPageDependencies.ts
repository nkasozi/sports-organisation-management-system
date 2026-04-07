import {
  get_competition_stage_use_cases,
  get_fixture_use_cases,
  get_official_performance_rating_use_cases,
  get_official_use_cases,
  get_organization_use_cases,
} from "$lib/infrastructure/registry/useCaseFactories";

export const official_leaderboard_page_dependencies = {
  organization_use_cases: get_organization_use_cases(),
  official_performance_rating_use_cases:
    get_official_performance_rating_use_cases(),
  official_use_cases: get_official_use_cases(),
  fixture_use_cases: get_fixture_use_cases(),
  competition_stage_use_cases: get_competition_stage_use_cases(),
};
