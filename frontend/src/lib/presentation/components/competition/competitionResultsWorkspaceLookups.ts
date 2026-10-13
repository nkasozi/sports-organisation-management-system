import type { Competition } from "$lib/core/entities/Competition";
import type { CompetitionStage } from "$lib/core/entities/CompetitionStage";
import type { Team } from "$lib/core/entities/Team";
import {
  get_competition_results_extended_competition_name,
  get_competition_results_extended_team_name,
  get_competition_results_stage_name,
  get_competition_results_stage_type,
  get_competition_results_team_logo_url,
  get_competition_results_team_name,
} from "$lib/presentation/logic/competitionResultsWorkspaceDisplay";

interface CompetitionResultsWorkspaceLookupSources {
  competition_stages: CompetitionStage[];
  competition_stage_map: Map<string, CompetitionStage>;
  team_map: Map<string, Team>;
  extended_team_map: Map<string, Team>;
  extended_competition_map: Map<string, Competition>;
}

interface CompetitionResultsWorkspaceLookups {
  get_fixture_stage_name: (stage_id: string) => string;
  get_fixture_stage_type: (stage_id: string) => string;
  get_team_name: (team_id: string) => string;
  get_team_name_extended: (team_id: string) => string;
  get_competition_name_extended: (competition_id: string) => string;
  get_team_logo_url: (team_id: string) => string;
}

export function build_competition_results_workspace_lookups(
  sources: CompetitionResultsWorkspaceLookupSources,
): CompetitionResultsWorkspaceLookups {
  return {
    get_fixture_stage_name: (stage_id) =>
      get_competition_results_stage_name(
        stage_id || "",
        sources.competition_stages,
        sources.competition_stage_map,
      ),
    get_fixture_stage_type: (stage_id) =>
      get_competition_results_stage_type(
        stage_id || "",
        sources.competition_stage_map,
      ),
    get_team_name: (team_id) =>
      get_competition_results_team_name(team_id, sources.team_map),
    get_team_name_extended: (team_id) =>
      get_competition_results_extended_team_name(
        team_id,
        sources.extended_team_map,
        sources.team_map,
      ),
    get_competition_name_extended: (competition_id) =>
      get_competition_results_extended_competition_name(
        competition_id,
        sources.extended_competition_map,
      ),
    get_team_logo_url: (team_id) =>
      get_competition_results_team_logo_url(
        team_id,
        sources.team_map,
        sources.extended_team_map,
      ),
  };
}
