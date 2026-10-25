import {
  get_competition_use_cases,
  get_fixture_use_cases,
  get_game_official_role_use_cases,
  get_jersey_color_use_cases,
  get_official_use_cases,
  get_organization_use_cases,
  get_sport_use_cases,
} from "$lib/infrastructure/registry/useCaseFactories";

import type { FixtureDetailsSetupAutoPopulateDependencies } from "./fixtureDetailsSetupAutoPopulate";

export function build_fixture_setup_suggestion_dependencies(): FixtureDetailsSetupAutoPopulateDependencies {
  return {
    fixture_use_cases: get_fixture_use_cases(),
    jersey_color_use_cases: get_jersey_color_use_cases(),
    official_use_cases: get_official_use_cases(),
    game_official_role_use_cases: get_game_official_role_use_cases(),
    competition_use_cases: get_competition_use_cases(),
    organization_use_cases: get_organization_use_cases(),
    sport_use_cases: get_sport_use_cases(),
  };
}
