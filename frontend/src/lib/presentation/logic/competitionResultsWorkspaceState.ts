import {
  derive_competition_results_fixtures_section,
  derive_competition_results_standings_section,
  derive_competition_results_stats_section,
  derive_competition_results_team_fixtures_section,
} from "$lib/presentation/logic/competitionResultsWorkspaceSections";
import type {
  CompetitionResultsWorkspaceStateCommand,
  CompetitionResultsWorkspaceStateResult,
} from "$lib/presentation/logic/competitionResultsWorkspaceStateTypes";

export function derive_competition_results_workspace_state(
  command: CompetitionResultsWorkspaceStateCommand,
): CompetitionResultsWorkspaceStateResult {
  return {
    ...derive_competition_results_standings_section(command),
    ...derive_competition_results_fixtures_section(command),
    ...derive_competition_results_stats_section(command),
    ...derive_competition_results_team_fixtures_section(command),
  };
}
