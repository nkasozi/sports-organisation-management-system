import type { CompetitionTeam } from "../../../core/entities/CompetitionTeam";
import { create_seed_competition_teams_part1 } from "./seedCompetitionTeams1";
import { create_seed_competition_teams_part2 } from "./seedCompetitionTeams2";

export function create_seed_competition_teams(): import("$lib/core/types/DomainScalars").ScalarInput<CompetitionTeam>[] {
  return [
    ...create_seed_competition_teams_part1(),
    ...create_seed_competition_teams_part2(),
  ];
}
