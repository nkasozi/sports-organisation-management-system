import type { Competition } from "$lib/core/entities/Competition";
import type { Team } from "$lib/core/entities/Team";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";

import { load_competition_results_listings } from "./competitionResultsBundleListings";
import {
  build_bundle_load_state,
  COMPETITION_RESULTS_BUNDLE_LOAD_STATUS,
} from "./competitionResultsBundleLoadState";
import type {
  CompetitionResultsCompetitionFormatState,
  CompetitionResultsSelectedCompetitionState,
} from "./competitionResultsPageContracts";
import type {
  CompetitionResultsCompetitionBundle,
  CompetitionResultsDependencies,
  EntityResult,
} from "./competitionResultsPageTypes";
import { load_competition_sport_rules } from "./competitionSportLookup";
import {
  build_match_report_sport_rules,
  type MatchReportSportRules,
} from "./matchReportSportRules";

export { COMPETITION_RESULTS_BUNDLE_LOAD_STATUS } from "./competitionResultsBundleLoadState";

function create_empty_competition_results_competition_bundle(): CompetitionResultsCompetitionBundle {
  return {
    selected_competition_state: { status: "missing" },
    competition_format_state: { status: "missing" },
    competition_stages: [],
    teams: [],
    team_map: new Map(),
    fixtures: [],
    sport_rules: build_match_report_sport_rules(void 0, void 0),
    load_state: { status: COMPETITION_RESULTS_BUNDLE_LOAD_STATUS.LOADED },
  };
}

function build_selected_competition_state(
  competition_result: EntityResult<Competition>,
): CompetitionResultsSelectedCompetitionState {
  if (!competition_result.success || !competition_result.data) {
    return { status: "missing" };
  }

  return {
    status: "present",
    competition: competition_result.data,
  };
}

async function load_competition_format_state(
  dependencies: CompetitionResultsDependencies,
  selected_competition_state: CompetitionResultsSelectedCompetitionState,
): Promise<CompetitionResultsCompetitionFormatState> {
  if (selected_competition_state.status === PRESENCE_STATUS.MISSING) {
    return { status: "missing" };
  }

  const competition_format_id =
    selected_competition_state.competition.competition_format_id;

  if (!competition_format_id) {
    return { status: "missing" };
  }

  const competition_format_result =
    await dependencies.format_use_cases.get_by_id(competition_format_id);

  if (!competition_format_result.success || !competition_format_result.data) {
    return { status: "missing" };
  }

  return {
    status: "present",
    competition_format: competition_format_result.data,
  };
}

async function load_bundle_sport_rules(
  dependencies: CompetitionResultsDependencies,
  selected_competition_state: CompetitionResultsSelectedCompetitionState,
): Promise<MatchReportSportRules> {
  switch (selected_competition_state.status) {
    case PRESENCE_STATUS.MISSING:
      return build_match_report_sport_rules(void 0, void 0);
    case PRESENCE_STATUS.PRESENT:
      return load_competition_sport_rules(
        selected_competition_state.competition,
        dependencies,
      );
  }
}

export async function load_selected_competition_bundle(
  dependencies: CompetitionResultsDependencies,
  selected_competition_id: string,
): Promise<CompetitionResultsCompetitionBundle> {
  if (!selected_competition_id)
    return create_empty_competition_results_competition_bundle();
  const selected_competition_state = build_selected_competition_state(
    await dependencies.competition_use_cases.get_by_id(selected_competition_id),
  );
  const competition_format_state = await load_competition_format_state(
    dependencies,
    selected_competition_state,
  );
  const listings = await load_competition_results_listings(
    dependencies,
    selected_competition_id,
  );
  return {
    selected_competition_state,
    competition_format_state,
    competition_stages: listings.competition_stages.items,
    teams: listings.teams.items,
    team_map: new Map(
      listings.teams.items.map((team: Team) => [team.id, team]),
    ),
    fixtures: listings.fixtures.items,
    sport_rules: await load_bundle_sport_rules(
      dependencies,
      selected_competition_state,
    ),
    load_state: build_bundle_load_state(selected_competition_id, [
      ...listings.competition_stages.failed_sources,
      ...listings.teams.failed_sources,
      ...listings.fixtures.failed_sources,
    ]),
  };
}
