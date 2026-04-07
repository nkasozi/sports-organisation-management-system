import {
  get_competition_team_use_cases,
  get_competition_use_cases,
} from "$lib/infrastructure/registry/useCaseFactories";

export const competition_edit_workspace_dependencies = {
  competition_use_cases: get_competition_use_cases(),
  competition_team_use_cases: get_competition_team_use_cases(),
};
