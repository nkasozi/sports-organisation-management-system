import type {
  JerseyColor,
  CreateJerseyColorInput,
  UpdateJerseyColorInput,
  JerseyColorHolderType,
} from "../../entities/JerseyColor";
import type { JerseyColorFilter } from "../adapters/JerseyColorRepository";
import type { QueryOptions } from "../adapters/Repository";
import type { AsyncResult, PaginatedAsyncResult } from "../../types/Result";

export interface JerseyColorUseCasesPort {
  create(input: CreateJerseyColorInput): AsyncResult<JerseyColor>;
  update(id: string, input: UpdateJerseyColorInput): AsyncResult<JerseyColor>;
  delete(id: string): AsyncResult<boolean>;
  get_by_id(id: string): AsyncResult<JerseyColor>;
  list(
    filter?: JerseyColorFilter | Record<string, string>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<JerseyColor>;
  list_by_holder(
    holder_type: JerseyColorHolderType,
    holder_id: string,
  ): PaginatedAsyncResult<JerseyColor>;
  list_all(): PaginatedAsyncResult<JerseyColor>;
  list_jerseys_by_entity(
    holder_type: JerseyColorHolderType,
    holder_id: string,
  ): PaginatedAsyncResult<JerseyColor>;
}
