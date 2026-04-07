import type {
  CreateOfficialInput,
  Official,
  UpdateOfficialInput,
} from "../../../../entities/Official";
import type { PaginatedAsyncResult } from "../../../../types/Result";
import type { FilterableRepository, QueryOptions } from "./Repository";

export interface OfficialFilter {
  name_contains?: string;
  organization_id?: string;
  role_id?: string;
  status?: Official["status"];
}

export interface OfficialRepository extends FilterableRepository<
  Official,
  CreateOfficialInput,
  UpdateOfficialInput,
  OfficialFilter
> {
  find_by_organization(
    organization_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Official>;
  find_active_officials(options?: QueryOptions): PaginatedAsyncResult<Official>;
  find_available_for_date(
    date: string,
    organization_id?: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Official>;
}
