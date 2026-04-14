import type {
  CreateGenderInput,
  Gender,
  UpdateGenderInput,
} from "../../../../entities/Gender";
import type { PaginatedAsyncResult } from "../../../../types/Result";
import type { QueryOptions, Repository } from "./Repository";

export interface GenderFilter {
  status?: Gender["status"];
  organization_id?: Gender["organization_id"];
}

export interface GenderRepository extends Repository<
  Gender,
  CreateGenderInput,
  UpdateGenderInput,
  GenderFilter
> {
  find_active_genders(options?: QueryOptions): PaginatedAsyncResult<Gender>;
  find_by_organization(
    organization_id: Gender["organization_id"],
    options?: QueryOptions,
  ): PaginatedAsyncResult<Gender>;
}
