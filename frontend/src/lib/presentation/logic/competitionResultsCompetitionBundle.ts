import type { Competition } from "$lib/core/entities/Competition";
import type { CompetitionStage } from "$lib/core/entities/CompetitionStage";
import type { CompetitionTeam } from "$lib/core/entities/CompetitionTeam";
import type { Team } from "$lib/core/entities/Team";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";

import type {
  CompetitionResultsCompetitionFormatState,
  CompetitionResultsSelectedCompetitionState,
} from "./competitionResultsPageContracts";
import type {
  CompetitionResultsCompetitionBundle,
  CompetitionResultsDependencies,
  EntityListResult,
  EntityResult,
} from "./competitionResultsPageTypes";
import { load_competition_sport_rules } from "./competitionSportLookup";
import {
  build_match_report_sport_rules,
  type MatchReportSportRules,
} from "./matchReportSportRules";

const COMPETITION_RESULTS_BUNDLE_PAGINATION = {
  page_number: 1,
  page_size: 100,
};

function extract_competition_results_items<EntityType>(
  list_result: EntityListResult<EntityType>,
): EntityType[] {
  return list_result.success ? list_result.data?.items || [] : [];
}

function create_empty_competition_results_competition_bundle(): CompetitionResultsCompetitionBundle {
  return {
    selected_competition_state: { status: "missing" },
    competition_format_state: { status: "missing" },
    competition_stages: [],
    teams: [],
    team_map: new Map(),
    fixtures: [],
    sport_rules: build_match_report_sport_rules(void 0, void 0),
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

async function load_competition_results_teams(
  dependencies: CompetitionResultsDependencies,
  selected_competition_id: string,
): Promise<Team[]> {
  const competition_teams_result =
    await dependencies.competition_team_use_cases.list_teams_in_competition(
      selected_competition_id,
      { ...COMPETITION_RESULTS_BUNDLE_PAGINATION },
    );
  const team_results = await Promise.all(
    extract_competition_results_items(competition_teams_result).map(
      (competition_team: CompetitionTeam) =>
        dependencies.team_use_cases.get_by_id(competition_team.team_id),
    ),
  );
  return team_results.flatMap((team_result: EntityResult<Team>) =>
    team_result.success && team_result.data ? [team_result.data] : [],
  );
}

async function load_competition_results_stages(
  dependencies: CompetitionResultsDependencies,
  selected_competition_id: string,
): Promise<CompetitionStage[]> {
  return extract_competition_results_items(
    await dependencies.competition_stage_use_cases.list_stages_by_competition(
      selected_competition_id,
      { ...COMPETITION_RESULTS_BUNDLE_PAGINATION },
    ),
  );
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
  const competition_stages = await load_competition_results_stages(
    dependencies,
    selected_competition_id,
  );
  const teams = await load_competition_results_teams(
    dependencies,
    selected_competition_id,
  );
  const fixtures = extract_competition_results_items(
    await dependencies.fixture_use_cases.list_fixtures_by_competition(
      selected_competition_id,
    ),
  );
  const sport_rules = await load_bundle_sport_rules(
    dependencies,
    selected_competition_state,
  );
  return {
    selected_competition_state,
    competition_format_state,
    competition_stages,
    teams,
    team_map: new Map(teams.map((team: Team) => [team.id, team])),
    fixtures,
    sport_rules,
  };
}
