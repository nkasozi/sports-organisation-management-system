import type {
  CreateOfficialAssociatedTeamInput,
  OfficialAssociatedTeam,
  UpdateOfficialAssociatedTeamInput,
} from "../../../../entities/OfficialAssociatedTeam";
import type { ScalarValueInput } from "../../../../types/DomainScalars";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../../../types/Result";
import type { OfficialAssociatedTeamFilter } from "../../external/repositories/OfficialAssociatedTeamRepository";
import type { QueryOptions } from "../../external/repositories/Repository";

export interface OfficialAssociatedTeamUseCasesPort {
  create(
    input: CreateOfficialAssociatedTeamInput,
  ): AsyncResult<OfficialAssociatedTeam>;
  update(
    id: ScalarValueInput<OfficialAssociatedTeam["id"]>,
    input: UpdateOfficialAssociatedTeamInput,
  ): AsyncResult<OfficialAssociatedTeam>;
  delete(
    id: ScalarValueInput<OfficialAssociatedTeam["id"]>,
  ): AsyncResult<boolean>;
  get_by_id(
    id: ScalarValueInput<OfficialAssociatedTeam["id"]>,
  ): AsyncResult<OfficialAssociatedTeam>;
  list(
    filter?: OfficialAssociatedTeamFilter | Record<string, string>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<OfficialAssociatedTeam>;
  list_by_official(
    official_id: ScalarValueInput<OfficialAssociatedTeam["official_id"]>,
  ): PaginatedAsyncResult<OfficialAssociatedTeam>;
  list_by_team(
    team_id: ScalarValueInput<OfficialAssociatedTeam["team_id"]>,
  ): PaginatedAsyncResult<OfficialAssociatedTeam>;
  list_all(): PaginatedAsyncResult<OfficialAssociatedTeam>;
}
