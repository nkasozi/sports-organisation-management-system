import type {
  Identification,
  CreateIdentificationInput,
  UpdateIdentificationInput,
  IdentificationHolderType,
} from "../../entities/Identification";
import type { Repository, QueryOptions } from "./Repository";
import type { PaginatedAsyncResult } from "../../types/Result";

export interface IdentificationFilter {
  holder_type?: IdentificationHolderType;
  holder_id?: string;
  identification_type_id?: string;
  status?: string;
}

export interface IdentificationRepository extends Repository<
  Identification,
  CreateIdentificationInput,
  UpdateIdentificationInput
> {
  find_by_filter(
    filter: IdentificationFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Identification>;
  find_by_holder(
    holder_type: IdentificationHolderType,
    holder_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Identification>;
}
