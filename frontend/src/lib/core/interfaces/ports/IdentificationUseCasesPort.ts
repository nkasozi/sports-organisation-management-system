import type {
  Identification,
  CreateIdentificationInput,
  UpdateIdentificationInput,
  IdentificationHolderType,
} from "../../entities/Identification";
import type { IdentificationFilter } from "../adapters/IdentificationRepository";
import type { QueryOptions } from "../adapters/Repository";
import type { AsyncResult, PaginatedAsyncResult } from "../../types/Result";

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
