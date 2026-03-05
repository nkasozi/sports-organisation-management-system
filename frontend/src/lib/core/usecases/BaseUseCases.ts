import type { BaseEntity, EntityListResult } from "../entities/BaseEntity";
import type { AsyncResult } from "../types/Result";

export type { EntityListResult, AsyncResult };

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
  ): Promise<EntityListResult<T>>;
  update(id: string, input: UpdateInput): AsyncResult<T>;
  delete(id: string): AsyncResult<boolean>;
}
