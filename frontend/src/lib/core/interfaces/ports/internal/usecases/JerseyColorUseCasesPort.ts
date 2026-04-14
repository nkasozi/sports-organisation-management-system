import type {
  CreateJerseyColorInput,
  JerseyColor,
  JerseyColorHolderType,
  UpdateJerseyColorInput,
} from "../../../../entities/JerseyColor";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../../../types/Result";
import type { JerseyColorFilter } from "../../external/repositories/JerseyColorRepository";
import type { QueryOptions } from "../../external/repositories/Repository";

export interface JerseyColorUseCasesPort {
  create(input: CreateJerseyColorInput): AsyncResult<JerseyColor>;
  update(
    id: JerseyColor["id"],
    input: UpdateJerseyColorInput,
  ): AsyncResult<JerseyColor>;
  delete(id: JerseyColor["id"]): AsyncResult<boolean>;
  get_by_id(id: JerseyColor["id"]): AsyncResult<JerseyColor>;
  list(
    filter?: JerseyColorFilter | Record<string, string>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<JerseyColor>;
  list_by_holder(
    holder_type: JerseyColorHolderType,
    holder_id: JerseyColor["holder_id"],
  ): PaginatedAsyncResult<JerseyColor>;
  list_all(): PaginatedAsyncResult<JerseyColor>;
  list_jerseys_by_entity(
    holder_type: JerseyColorHolderType,
    holder_id: JerseyColor["holder_id"],
  ): PaginatedAsyncResult<JerseyColor>;
}
