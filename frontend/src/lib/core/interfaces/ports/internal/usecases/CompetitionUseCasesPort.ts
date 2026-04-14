import type {
  Competition,
  CreateCompetitionInput,
  UpdateCompetitionInput,
} from "../../../../entities/Competition";
import type { ScalarValueInput } from "../../../../types/DomainScalars";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../../../types/Result";
import type { CompetitionFilter } from "../../external/repositories/CompetitionRepository";
import type { QueryOptions } from "../../external/repositories/Repository";
import type { BaseUseCasesPort } from "./BaseUseCasesPort";

export interface CompetitionUseCasesPort extends BaseUseCasesPort<
  Competition,
  CreateCompetitionInput,
  UpdateCompetitionInput,
  CompetitionFilter
> {
  delete_competitions(
    ids: Array<ScalarValueInput<Competition["id"]>>,
  ): AsyncResult<number>;
  list_competitions_by_organization(
    organization_id: ScalarValueInput<Competition["organization_id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Competition>;
}
