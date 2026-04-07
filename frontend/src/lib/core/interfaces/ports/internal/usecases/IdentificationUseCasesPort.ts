import type {
  CreateIdentificationInput,
  Identification,
  IdentificationHolderType,
  UpdateIdentificationInput,
} from "../../../../entities/Identification";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../../../types/Result";
import type { IdentificationFilter } from "../../external/repositories/IdentificationRepository";
import type { QueryOptions } from "../../external/repositories/Repository";

export interface IdentificationUseCasesPort {
  create(input: CreateIdentificationInput): AsyncResult<Identification>;
  update(
    id: string,
    input: UpdateIdentificationInput,
  ): AsyncResult<Identification>;
  delete(id: string): AsyncResult<boolean>;
  get_by_id(id: string): AsyncResult<Identification>;
  list(
    filter?: IdentificationFilter | Record<string, string>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Identification>;
  list_by_holder(
    holder_type: IdentificationHolderType,
    holder_id: string,
  ): PaginatedAsyncResult<Identification>;
  list_all(): PaginatedAsyncResult<Identification>;
  list_identifications_by_entity(
    holder_type: IdentificationHolderType,
    holder_id: string,
  ): PaginatedAsyncResult<Identification>;
}
