import type { CompetitionStage } from "$lib/core/entities/CompetitionStage";
import type { CompetitionTeam } from "$lib/core/entities/CompetitionTeam";
import type { Fixture } from "$lib/core/entities/Fixture";
import type { Team } from "$lib/core/entities/Team";

import {
  BUNDLE_SOURCE,
  type LoadedItems,
  read_competition_results_items,
} from "./competitionResultsBundleLoadState";
import type {
  CompetitionResultsDependencies,
  EntityResult,
} from "./competitionResultsPageTypes";

const COMPETITION_RESULTS_BUNDLE_PAGINATION = {
  page_number: 1,
  page_size: 100,
};

async function load_competition_results_teams(
  dependencies: CompetitionResultsDependencies,
  selected_competition_id: string,
): Promise<LoadedItems<Team>> {
  const competition_teams = read_competition_results_items(
    await dependencies.competition_team_use_cases.list_teams_in_competition(
      selected_competition_id,
      { ...COMPETITION_RESULTS_BUNDLE_PAGINATION },
    ),
    BUNDLE_SOURCE.TEAMS,
  );
  const team_results = await Promise.all(
    competition_teams.items.map((competition_team: CompetitionTeam) =>
      dependencies.team_use_cases.get_by_id(competition_team.team_id),
    ),
  );
  return {
    items: team_results.flatMap((team_result: EntityResult<Team>) =>
      team_result.success && team_result.data ? [team_result.data] : [],
    ),
    failed_sources: competition_teams.failed_sources,
  };
}

async function load_competition_results_stages(
  dependencies: CompetitionResultsDependencies,
  selected_competition_id: string,
): Promise<LoadedItems<CompetitionStage>> {
  return read_competition_results_items(
    await dependencies.competition_stage_use_cases.list_stages_by_competition(
      selected_competition_id,
      { ...COMPETITION_RESULTS_BUNDLE_PAGINATION },
    ),
    BUNDLE_SOURCE.STAGES,
  );
}

type CompetitionResultsListings = {
  competition_stages: LoadedItems<CompetitionStage>;
  teams: LoadedItems<Team>;
  fixtures: LoadedItems<Fixture>;
};

export async function load_competition_results_listings(
  dependencies: CompetitionResultsDependencies,
  selected_competition_id: string,
): Promise<CompetitionResultsListings> {
  return {
    competition_stages: await load_competition_results_stages(
      dependencies,
      selected_competition_id,
    ),
    teams: await load_competition_results_teams(
      dependencies,
      selected_competition_id,
    ),
    fixtures: read_competition_results_items(
      await dependencies.fixture_use_cases.list_fixtures_by_competition(
        selected_competition_id,
      ),
      BUNDLE_SOURCE.FIXTURES,
    ),
  };
}
