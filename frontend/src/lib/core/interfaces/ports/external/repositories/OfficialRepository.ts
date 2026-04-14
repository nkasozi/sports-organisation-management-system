import type {
  CreateOfficialInput,
  Official,
  UpdateOfficialInput,
} from "../../../../entities/Official";
import type { ScalarValueInput } from "../../../../types/DomainScalars";
import type { PaginatedAsyncResult } from "../../../../types/Result";
import type { FilterableRepository, QueryOptions } from "./Repository";

export interface OfficialFilter {
  name_contains?: string;
  organization_id?: ScalarValueInput<Official["organization_id"]>;
  role_id?: ScalarValueInput<Official["id"]>;
  status?: Official["status"];
}

export interface OfficialRepository extends FilterableRepository<
  Official,
  CreateOfficialInput,
  UpdateOfficialInput,
  OfficialFilter
> {
  find_by_organization(
    organization_id: ScalarValueInput<Official["organization_id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Official>;
  find_active_officials(options?: QueryOptions): PaginatedAsyncResult<Official>;
  find_available_for_date(
    date: ScalarValueInput<Official["date_of_birth"]>,
    organization_id?: ScalarValueInput<Official["organization_id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Official>;
}
