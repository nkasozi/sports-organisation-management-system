import type {
  OfficialAssociatedTeam,
  CreateOfficialAssociatedTeamInput,
  UpdateOfficialAssociatedTeamInput,
} from "../../entities/OfficialAssociatedTeam";
import type { OfficialAssociatedTeamFilter } from "../adapters/OfficialAssociatedTeamRepository";
import type { QueryOptions } from "../adapters/Repository";
import type { AsyncResult, PaginatedAsyncResult } from "../../types/Result";

export interface OfficialAssociatedTeamUseCasesPort {
  create(
    input: CreateOfficialAssociatedTeamInput,
  ): AsyncResult<OfficialAssociatedTeam>;
  update(
    id: string,
    input: UpdateOfficialAssociatedTeamInput,
  ): AsyncResult<OfficialAssociatedTeam>;
  delete(id: string): AsyncResult<boolean>;
  get_by_id(id: string): AsyncResult<OfficialAssociatedTeam>;
  list(
    filter?: OfficialAssociatedTeamFilter | Record<string, string>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<OfficialAssociatedTeam>;
  list_by_official(
    official_id: string,
  ): PaginatedAsyncResult<OfficialAssociatedTeam>;
  list_by_team(team_id: string): PaginatedAsyncResult<OfficialAssociatedTeam>;
  list_all(): PaginatedAsyncResult<OfficialAssociatedTeam>;
}
