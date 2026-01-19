import type {
  IdentificationType,
  CreateIdentificationTypeInput,
  UpdateIdentificationTypeInput,
} from "../../entities/IdentificationType";
import type { IdentificationTypeFilter } from "../adapters/IdentificationTypeRepository";
import type { QueryOptions } from "../adapters/Repository";
import type { AsyncResult, PaginatedAsyncResult } from "../../types/Result";

export interface IdentificationTypeUseCasesPort {
  create(input: CreateIdentificationTypeInput): AsyncResult<IdentificationType>;
  update(
    id: string,
    input: UpdateIdentificationTypeInput,
  ): AsyncResult<IdentificationType>;
  delete(id: string): AsyncResult<boolean>;
  get_by_id(id: string): AsyncResult<IdentificationType>;
  list(
    filter?: IdentificationTypeFilter | Record<string, string>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<IdentificationType>;
  list_all(): PaginatedAsyncResult<IdentificationType>;
  list_types_by_sport(
    sport_id: string,
  ): PaginatedAsyncResult<IdentificationType>;
}
