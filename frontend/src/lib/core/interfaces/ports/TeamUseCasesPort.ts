import type {
  Team,
  CreateTeamInput,
  UpdateTeamInput,
} from "../../entities/Team";
import type { TeamFilter } from "../adapters/TeamRepository";
import type { QueryOptions } from "../adapters/Repository";
import type { AsyncResult, PaginatedAsyncResult } from "../../types/Result";
import type { BaseUseCasesPort } from "./BaseUseCasesPort";

export interface TeamUseCasesPort extends BaseUseCasesPort<
  Team,
  CreateTeamInput,
  UpdateTeamInput,
  TeamFilter
> {
  delete_teams(ids: string[]): Promise<AsyncResult<number>>;
  list_teams_by_organization(
    organization_id: string,
    options?: QueryOptions,
  ): Promise<PaginatedAsyncResult<Team>>;
}
