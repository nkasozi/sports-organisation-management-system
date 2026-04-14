import type {
  CompetitionTeam,
  CreateCompetitionTeamInput,
  UpdateCompetitionTeamInput,
} from "../../../../entities/CompetitionTeam";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../../../types/Result";
import type { ScalarValueInput } from "../../../../types/DomainScalars";
import type { CompetitionTeamFilter } from "../../external/repositories/CompetitionTeamRepository";
import type { QueryOptions } from "../../external/repositories/Repository";
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
    competition_id: ScalarValueInput<CompetitionTeam["competition_id"]>,
    team_id: ScalarValueInput<CompetitionTeam["team_id"]>,
  ): AsyncResult<boolean>;
  list_teams_in_competition(
    competition_id: ScalarValueInput<CompetitionTeam["competition_id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<CompetitionTeam>;
  list_competitions_for_team(
    team_id: ScalarValueInput<CompetitionTeam["team_id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<CompetitionTeam>;
  is_team_in_competition(
    competition_id: ScalarValueInput<CompetitionTeam["competition_id"]>,
    team_id: ScalarValueInput<CompetitionTeam["team_id"]>,
  ): AsyncResult<CompetitionTeam>;
}
