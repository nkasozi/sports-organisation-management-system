import type {
  IdentificationType,
  CreateIdentificationTypeInput,
  UpdateIdentificationTypeInput,
} from "../../../../entities/IdentificationType";
import type { Repository, QueryOptions } from "./Repository";
import type { PaginatedAsyncResult } from "../../../../types/Result";

export interface IdentificationTypeFilter {
  status?: string;
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
}
