import {
  get_competition_use_cases,
  get_fixture_lineup_use_cases,
  get_fixture_use_cases,
  get_official_use_cases,
  get_organization_use_cases,
  get_team_staff_use_cases,
  get_team_use_cases,
} from "$lib/infrastructure/registry/useCaseFactories";
import type { CompetitionResultsMatchReportDependencies } from "$lib/presentation/logic/competitionResultsMatchReportHelpers";

export const competition_results_workspace_dependencies = {
  fixture_use_cases: get_fixture_use_cases(),
  team_use_cases: get_team_use_cases(),
  competition_use_cases: get_competition_use_cases(),
};

export const competition_results_match_report_dependencies: CompetitionResultsMatchReportDependencies =
  {
    fixture_lineup_use_cases: get_fixture_lineup_use_cases(),
    official_use_cases: get_official_use_cases(),
    organization_use_cases: get_organization_use_cases(),
    team_staff_use_cases: get_team_staff_use_cases(),
  };
