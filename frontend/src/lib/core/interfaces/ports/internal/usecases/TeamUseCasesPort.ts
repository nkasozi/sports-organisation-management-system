import type {
  CreateTeamInput,
  Team,
  UpdateTeamInput,
} from "../../../../entities/Team";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../../../types/Result";
import type { QueryOptions } from "../../external/repositories/Repository";
import type { TeamFilter } from "../../external/repositories/TeamRepository";
import type { BaseUseCasesPort } from "./BaseUseCasesPort";

export interface TeamUseCasesPort extends BaseUseCasesPort<
  Team,
  CreateTeamInput,
  UpdateTeamInput,
  TeamFilter
> {
  delete_teams(ids: string[]): AsyncResult<number>;
  list_teams_by_organization(
    organization_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Team>;
}
