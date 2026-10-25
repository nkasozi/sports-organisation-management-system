import {
  get_competition_stage_use_cases,
  get_competition_team_use_cases,
  get_competition_use_cases,
  get_fixture_details_setup_use_cases,
  get_fixture_lineup_use_cases,
  get_fixture_use_cases,
  get_official_use_cases,
  get_organization_use_cases,
  get_player_use_cases,
  get_team_use_cases,
  get_venue_use_cases,
} from "$lib/infrastructure/registry/useCaseFactories";

import type { ConceptGuideSources } from "./conceptGuideLoader";

export function create_concept_guide_sources(): ConceptGuideSources {
  return {
    organizations: get_organization_use_cases(),
    venues: get_venue_use_cases(),
    teams: get_team_use_cases(),
    players: get_player_use_cases(),
    officials: get_official_use_cases(),
    competitions: get_competition_use_cases(),
    stages: get_competition_stage_use_cases(),
    entries: get_competition_team_use_cases(),
    fixtures: get_fixture_use_cases(),
    fixture_setups: get_fixture_details_setup_use_cases(),
    lineups: get_fixture_lineup_use_cases(),
  } as unknown as ConceptGuideSources;
}
