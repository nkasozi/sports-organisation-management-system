import type { BaseEntity } from "../../../../entities/BaseEntity";
import type { ScalarValueInput } from "../../../../types/DomainScalars";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../../../types/Result";

export interface QueryOptions {
  page_number?: number;
  page_size?: number;
  sort_by?: string;
  sort_direction?: "asc" | "desc";
}

export interface Repository<
  TEntity extends BaseEntity,
  TCreateInput,
  TUpdateInput,
  TFilter = undefined,
> {
  find_all(
    filter?: TFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<TEntity>;
  find_by_id(id: ScalarValueInput<TEntity["id"]>): AsyncResult<TEntity>;
  find_by_ids(
    ids: ScalarValueInput<TEntity["id"]>[],
  ): AsyncResult<TEntity[]>;
  create(input: TCreateInput): AsyncResult<TEntity>;
  update(
    id: ScalarValueInput<TEntity["id"]>,
    input: TUpdateInput,
  ): AsyncResult<TEntity>;
  delete_by_id(id: ScalarValueInput<TEntity["id"]>): AsyncResult<boolean>;
  delete_by_ids(
    ids: ScalarValueInput<TEntity["id"]>[],
  ): AsyncResult<number>;
  count(): AsyncResult<number>;
}

export type FilterableRepository<
  TEntity extends BaseEntity,
  TCreateInput,
  TUpdateInput,
  TFilter,
> = Repository<TEntity, TCreateInput, TUpdateInput, TFilter>;

export type { PaginatedAsyncResult } from "../../../../types/Result";
