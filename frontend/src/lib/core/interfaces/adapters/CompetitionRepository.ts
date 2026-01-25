import type { FilterableRepository, QueryOptions } from "./Repository";
import type { PaginatedAsyncResult } from "../../types/Result";
import type {
  Competition,
  CreateCompetitionInput,
  UpdateCompetitionInput,
} from "../../entities/Competition";

export interface CompetitionFilter {
  name_contains?: string;
  organization_id?: string;
  status?: Competition["status"];
  start_date_after?: string;
  start_date_before?: string;
}

export interface CompetitionRepository extends FilterableRepository<
  Competition,
  CreateCompetitionInput,
  UpdateCompetitionInput,
  CompetitionFilter
> {
  find_by_organization(
    organization_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Competition>;
  find_active_competitions(
    options?: QueryOptions,
  ): PaginatedAsyncResult<Competition>;
}
