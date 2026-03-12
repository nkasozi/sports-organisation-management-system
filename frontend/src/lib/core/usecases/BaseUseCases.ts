import type { BaseEntity } from "../entities/BaseEntity";
import type { AsyncResult, PaginatedAsyncResult } from "../types/Result";

export type { AsyncResult, PaginatedAsyncResult };

export interface BaseUseCases<
  T extends BaseEntity,
  CreateInput,
  UpdateInput,
  Filter = any,
> {
  create(input: CreateInput): AsyncResult<T>;
  get_by_id(id: string): AsyncResult<T>;
  list(
    filter?: Filter,
    pagination?: { page: number; page_size: number },
  ): PaginatedAsyncResult<T>;
  update(id: string, input: UpdateInput): AsyncResult<T>;
  delete(id: string): AsyncResult<boolean>;
}
