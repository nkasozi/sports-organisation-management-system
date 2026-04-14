import type {
  CreateIdentificationInput,
  Identification,
  IdentificationHolderType,
  UpdateIdentificationInput,
} from "../../../../entities/Identification";
import type { ScalarValueInput } from "../../../../types/DomainScalars";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../../../types/Result";
import type { IdentificationFilter } from "../../external/repositories/IdentificationRepository";
import type { QueryOptions } from "../../external/repositories/Repository";

export interface IdentificationUseCasesPort {
  create(input: CreateIdentificationInput): AsyncResult<Identification>;
  update(
    id: ScalarValueInput<Identification["id"]>,
    input: UpdateIdentificationInput,
  ): AsyncResult<Identification>;
  delete(id: ScalarValueInput<Identification["id"]>): AsyncResult<boolean>;
  get_by_id(
    id: ScalarValueInput<Identification["id"]>,
  ): AsyncResult<Identification>;
  list(
    filter?: IdentificationFilter | Record<string, string>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Identification>;
  list_by_holder(
    holder_type: IdentificationHolderType,
    holder_id: ScalarValueInput<Identification["holder_id"]>,
  ): PaginatedAsyncResult<Identification>;
  list_all(): PaginatedAsyncResult<Identification>;
  list_identifications_by_entity(
    holder_type: IdentificationHolderType,
    holder_id: ScalarValueInput<Identification["holder_id"]>,
  ): PaginatedAsyncResult<Identification>;
}
