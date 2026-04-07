import {
  get_competition_format_use_cases,
  get_competition_team_use_cases,
  get_competition_use_cases,
  get_organization_use_cases,
  get_team_use_cases,
} from "$lib/infrastructure/registry/useCaseFactories";

export const competition_create_dependencies = {
  competition_use_cases: get_competition_use_cases(),
  competition_team_use_cases: get_competition_team_use_cases(),
  organization_use_cases: get_organization_use_cases(),
  competition_format_use_cases: get_competition_format_use_cases(),
  team_use_cases: get_team_use_cases(),
};

export const COMPETITION_CREATE_PAGE_TEXT = {
  access_denied: "You do not have permission to create competitions.",
  created: "Competition created successfully!",
  create_path: "/competitions/create",
  title: "Create Competition - Sports Management",
} as const;
