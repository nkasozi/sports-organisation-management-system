import type {
  CreateIdentificationInput,
  Identification,
  IdentificationHolderType,
  UpdateIdentificationInput,
} from "../../../../entities/Identification";
import type { PaginatedAsyncResult } from "../../../../types/Result";
import type { QueryOptions, Repository } from "./Repository";

export interface IdentificationFilter {
  holder_type?: IdentificationHolderType;
  holder_id?: string;
  identification_type_id?: string;
  status?: string;
}

export interface IdentificationRepository extends Repository<
  Identification,
  CreateIdentificationInput,
  UpdateIdentificationInput,
  IdentificationFilter
> {
  find_by_holder(
    holder_type: IdentificationHolderType,
    holder_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Identification>;
}
