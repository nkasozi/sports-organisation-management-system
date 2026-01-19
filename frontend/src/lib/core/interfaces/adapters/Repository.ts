import type { AsyncResult, PaginatedAsyncResult } from "../../types/Result";
import type { BaseEntity } from "../../entities/BaseEntity";

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
> {
  find_all(options?: QueryOptions): PaginatedAsyncResult<TEntity>;
  find_by_id(id: string): AsyncResult<TEntity>;
  find_by_ids(ids: string[]): AsyncResult<TEntity[]>;
  create(input: TCreateInput): AsyncResult<TEntity>;
  update(id: string, input: TUpdateInput): AsyncResult<TEntity>;
  delete_by_id(id: string): AsyncResult<boolean>;
  delete_by_ids(ids: string[]): AsyncResult<number>;
  count(): AsyncResult<number>;
}

export interface FilterableRepository<
  TEntity extends BaseEntity,
  TCreateInput,
  TUpdateInput,
  TFilter,
> extends Repository<TEntity, TCreateInput, TUpdateInput> {
  find_by_filter(
    filter: TFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<TEntity>;
}
