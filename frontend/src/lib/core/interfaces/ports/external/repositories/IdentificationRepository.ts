import type {
  CreateIdentificationInput,
  Identification,
  IdentificationHolderType,
  UpdateIdentificationInput,
} from "../../../../entities/Identification";
import type { ScalarValueInput } from "../../../../types/DomainScalars";
import type { PaginatedAsyncResult } from "../../../../types/Result";
import type { QueryOptions, Repository } from "./Repository";

export interface IdentificationFilter {
  holder_type?: IdentificationHolderType;
  holder_id?: ScalarValueInput<Identification["holder_id"]>;
  identification_type_id?: ScalarValueInput<Identification["identification_type_id"]>;
  status?: Identification["status"];
}

export interface IdentificationRepository extends Repository<
  Identification,
  CreateIdentificationInput,
  UpdateIdentificationInput,
  IdentificationFilter
> {
  find_by_holder(
    holder_type: IdentificationHolderType,
    holder_id: ScalarValueInput<Identification["holder_id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Identification>;
}
