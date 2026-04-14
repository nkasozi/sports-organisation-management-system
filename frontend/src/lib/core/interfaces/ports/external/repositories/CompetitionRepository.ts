import type {
  Competition,
  CreateCompetitionInput,
  UpdateCompetitionInput,
} from "../../../../entities/Competition";
import type { ScalarValueInput } from "../../../../types/DomainScalars";
import type { PaginatedAsyncResult } from "../../../../types/Result";
import type { FilterableRepository, QueryOptions } from "./Repository";

export interface CompetitionFilter {
  name_contains?: string;
  organization_id?: ScalarValueInput<Competition["organization_id"]>;
  status?: Competition["status"];
  start_date_after?: ScalarValueInput<Competition["start_date"]>;
  start_date_before?: ScalarValueInput<Competition["start_date"]>;
}

export interface CompetitionRepository extends FilterableRepository<
  Competition,
  CreateCompetitionInput,
  UpdateCompetitionInput,
  CompetitionFilter
> {
  find_by_organization(
    organization_id: ScalarValueInput<Competition["organization_id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Competition>;
  find_active_competitions(
    options?: QueryOptions,
  ): PaginatedAsyncResult<Competition>;
}
