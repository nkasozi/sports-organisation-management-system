import type { BaseEntity } from "../../../../entities/BaseEntity";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../../../types/Result";
import type { QueryOptions } from "../../external/repositories/Repository";

export type { AsyncResult, PaginatedAsyncResult };

export interface BaseUseCasesPort<
  T extends BaseEntity,
  CreateInput,
  UpdateInput,
  Filter = unknown,
> {
  create(input: CreateInput): AsyncResult<T>;
  get_by_id(id: string): AsyncResult<T>;
  list(
    filter?: Filter,
    pagination?: QueryOptions,
  ): PaginatedAsyncResult<T>;
  update(id: string, input: UpdateInput): AsyncResult<T>;
  delete(id: string): AsyncResult<boolean>;
}
