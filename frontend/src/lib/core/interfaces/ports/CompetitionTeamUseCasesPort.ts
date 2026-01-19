import type {
  CompetitionTeam,
  CreateCompetitionTeamInput,
  UpdateCompetitionTeamInput,
} from "../../entities/CompetitionTeam";
import type { CompetitionTeamFilter } from "../adapters/CompetitionTeamRepository";
import type { QueryOptions } from "../adapters/Repository";
import type { AsyncResult, PaginatedAsyncResult } from "../../types/Result";
import type { BaseUseCasesPort } from "./BaseUseCasesPort";

export interface CompetitionTeamUseCasesPort extends BaseUseCasesPort<
  CompetitionTeam,
  CreateCompetitionTeamInput,
  UpdateCompetitionTeamInput,
  CompetitionTeamFilter
> {
  add_team_to_competition(
    input: CreateCompetitionTeamInput,
  ): AsyncResult<CompetitionTeam>;
  remove_team_from_competition(
    competition_id: string,
    team_id: string,
  ): AsyncResult<boolean>;
  list_teams_in_competition(
    competition_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<CompetitionTeam>;
  list_competitions_for_team(
    team_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<CompetitionTeam>;
  is_team_in_competition(
    competition_id: string,
    team_id: string,
  ): AsyncResult<CompetitionTeam>;
}
