import type {
  Competition,
  CreateCompetitionInput,
  UpdateCompetitionInput,
} from "../../entities/Competition";
import type { CompetitionFilter } from "../adapters/CompetitionRepository";
import type { QueryOptions } from "../adapters/Repository";
import type { AsyncResult, PaginatedAsyncResult } from "../../types/Result";
import type { BaseUseCasesPort } from "./BaseUseCasesPort";

export interface CompetitionUseCasesPort extends BaseUseCasesPort<
  Competition,
  CreateCompetitionInput,
  UpdateCompetitionInput,
  CompetitionFilter
> {
  delete_competitions(ids: string[]): Promise<AsyncResult<number>>;
  list_competitions_by_organization(
    organization_id: string,
    options?: QueryOptions,
  ): Promise<PaginatedAsyncResult<Competition>>;
}
