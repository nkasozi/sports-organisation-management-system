import type {
  CreateOrganizationInput,
  Organization,
  UpdateOrganizationInput,
} from "../../../../entities/Organization";
import type { PaginatedAsyncResult } from "../../../../types/Result";
import type { FilterableRepository, QueryOptions } from "./Repository";

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
