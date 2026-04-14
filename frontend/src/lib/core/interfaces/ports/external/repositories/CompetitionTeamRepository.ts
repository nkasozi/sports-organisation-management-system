import type {
  CompetitionTeam,
  CompetitionTeamStatus,
  CreateCompetitionTeamInput,
  UpdateCompetitionTeamInput,
} from "../../../../entities/CompetitionTeam";
import type { ScalarValueInput } from "../../../../types/DomainScalars";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../../../types/Result";
import type { FilterableRepository, QueryOptions } from "./Repository";

export interface CompetitionTeamFilter {
  competition_id?: ScalarValueInput<CompetitionTeam["competition_id"]>;
  team_id?: ScalarValueInput<CompetitionTeam["team_id"]>;
  status?: CompetitionTeamStatus;
}

export interface CompetitionTeamRepository extends FilterableRepository<
  CompetitionTeam,
  CreateCompetitionTeamInput,
  UpdateCompetitionTeamInput,
  CompetitionTeamFilter
> {
  find_by_competition(
    competition_id: ScalarValueInput<CompetitionTeam["competition_id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<CompetitionTeam>;
  find_by_team(
    team_id: ScalarValueInput<CompetitionTeam["team_id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<CompetitionTeam>;
  find_team_in_competition(
    competition_id: ScalarValueInput<CompetitionTeam["competition_id"]>,
    team_id: ScalarValueInput<CompetitionTeam["team_id"]>,
  ): AsyncResult<CompetitionTeam>;
  remove_team_from_competition(
    competition_id: ScalarValueInput<CompetitionTeam["competition_id"]>,
    team_id: ScalarValueInput<CompetitionTeam["team_id"]>,
  ): AsyncResult<boolean>;
}
