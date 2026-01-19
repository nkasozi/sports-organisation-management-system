import type { FilterableRepository, QueryOptions } from "./Repository";
import type { AsyncResult, PaginatedAsyncResult } from "../../types/Result";
import type {
  Organization,
  CreateOrganizationInput,
  UpdateOrganizationInput,
} from "../../entities/Organization";

export interface OrganizationFilter {
  name_contains?: string;
  sport_id?: string;
  status?: Organization["status"];
}

export interface OrganizationRepository extends FilterableRepository<
  Organization,
  CreateOrganizationInput,
  UpdateOrganizationInput,
  OrganizationFilter
> {
  find_active_organizations(
    options?: QueryOptions,
  ): PaginatedAsyncResult<Organization>;
}
