import type {
  CreateIdentificationTypeInput,
  IdentificationType,
  UpdateIdentificationTypeInput,
} from "../../../../entities/IdentificationType";
import type { PaginatedAsyncResult } from "../../../../types/Result";
import type { QueryOptions, Repository } from "./Repository";

export interface IdentificationTypeFilter {
  status?: string;
  organization_id?: string;
}

export interface IdentificationTypeRepository extends Repository<
  IdentificationType,
  CreateIdentificationTypeInput,
  UpdateIdentificationTypeInput,
  IdentificationTypeFilter
> {
  find_active_types(
    options?: QueryOptions,
  ): PaginatedAsyncResult<IdentificationType>;
  find_by_organization(
    organization_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<IdentificationType>;
}
