import type {
  Gender,
  CreateGenderInput,
  UpdateGenderInput,
} from "../../entities/Gender";
import type { Repository, QueryOptions } from "./Repository";
import type { PaginatedAsyncResult } from "../../types/Result";

export interface GenderFilter {
  status?: string;
}

export interface GenderRepository extends Repository<
  Gender,
  CreateGenderInput,
  UpdateGenderInput
> {
  find_by_filter(
    filter: GenderFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Gender>;
  find_active_genders(options?: QueryOptions): PaginatedAsyncResult<Gender>;
}
