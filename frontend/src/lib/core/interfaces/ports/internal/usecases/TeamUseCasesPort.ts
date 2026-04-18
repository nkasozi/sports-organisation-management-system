import type {
  CreateTeamInput,
  Team,
  UpdateTeamInput,
} from "../../../../entities/Team";
import type { ScalarValueInput } from "../../../../types/DomainScalars";
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
  delete_teams(ids: Array<ScalarValueInput<Team["id"]>>): AsyncResult<number>;
  list_teams_by_organization(
    organization_id: ScalarValueInput<Team["organization_id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Team>;
}
