import type { FilterableRepository, QueryOptions } from "./Repository";
import type { PaginatedAsyncResult, AsyncResult } from "../../types/Result";
import type {
  CompetitionTeam,
  CreateCompetitionTeamInput,
  UpdateCompetitionTeamInput,
  CompetitionTeamStatus,
} from "../../entities/CompetitionTeam";

export interface CompetitionTeamFilter {
  competition_id?: string;
  team_id?: string;
  status?: CompetitionTeamStatus;
}

export interface CompetitionTeamRepository extends FilterableRepository<
  CompetitionTeam,
  CreateCompetitionTeamInput,
  UpdateCompetitionTeamInput,
  CompetitionTeamFilter
> {
  find_by_competition(
    competition_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<CompetitionTeam>;
  find_by_team(
    team_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<CompetitionTeam>;
  find_team_in_competition(
    competition_id: string,
    team_id: string,
  ): AsyncResult<CompetitionTeam>;
  remove_team_from_competition(
    competition_id: string,
    team_id: string,
  ): AsyncResult<boolean>;
}
