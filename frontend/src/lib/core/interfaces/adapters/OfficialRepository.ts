import type { FilterableRepository, QueryOptions } from "./Repository";
import type { PaginatedAsyncResult } from "../../types/Result";
import type {
  Official,
  CreateOfficialInput,
  UpdateOfficialInput,
} from "../../entities/Official";

export interface OfficialFilter {
  name_contains?: string;
  organization_id?: string;
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
