import type { Table } from "dexie";

import type { AsyncResult } from "../../core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "../../core/types/Result";
import {
  execute_repository_operation,
  type RepositoryFailureDetails,
  run_repository_query,
} from "./InBrowserRepositoryQueryRunner";

interface IndexLookup<TEntity> {
  table: Table<TEntity, string>;
  index_name: string;
  value: string;
  not_found_message: string;
  failure: RepositoryFailureDetails;
}

export function find_first_row_by_index<TEntity>(
  lookup: IndexLookup<TEntity>,
): AsyncResult<TEntity> {
  return run_repository_query(lookup.failure, async () => {
    const rows = await lookup.table
      .where(lookup.index_name)
      .equals(lookup.value)
      .toArray();
    return rows.length === 0
      ? create_failure_result(lookup.not_found_message)
      : create_success_result(rows[0]);
  });
}

interface IndexRowsQuery<TEntity> {
  table: Table<TEntity, string>;
  index_name: string;
  value: string;
  failure: RepositoryFailureDetails;
}

export function find_rows_by_index<TEntity>(
  query: IndexRowsQuery<TEntity>,
): AsyncResult<TEntity[]> {
  return execute_repository_operation(query.failure, () =>
    query.table.where(query.index_name).equals(query.value).toArray(),
  );
}
