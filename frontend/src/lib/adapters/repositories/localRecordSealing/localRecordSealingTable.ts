import type {
  DBCoreGetManyRequest,
  DBCoreGetRequest,
  DBCoreMutateRequest,
  DBCoreMutateResponse,
  DBCoreOpenCursorRequest,
  DBCoreQueryRequest,
  DBCoreQueryResponse,
  DBCoreTable,
} from "dexie";

import { open_local_rows } from "./localRecordSealer";
import { wrap_sealed_cursor } from "./localRecordSealingCursor";
import { with_local_data_key } from "./localRecordSealingKeyAccess";
import {
  mutate_sealed_records,
  mutation_needs_data_key,
} from "./localRecordSealingMutation";
import {
  type LocalRecordSealingDependencies,
  LocalRecordSealingOperation,
  type LocalRecordSealingPlan,
} from "./localRecordSealingTypes";

interface SealedTableContext {
  down_table: DBCoreTable;
  plan: LocalRecordSealingPlan;
  dependencies: LocalRecordSealingDependencies;
}

function open_and_report_rows(
  context: SealedTableContext,
  data_key: Uint8Array,
  stored_rows: readonly unknown[],
): unknown[] {
  const opened = open_local_rows(context.plan, data_key, stored_rows);
  if (opened.unreadable_count > 0)
    context.dependencies.report_unreadable_records(
      context.plan.table_name,
      opened.unreadable_count,
    );
  return opened.values;
}

function keep_readable_values(opened_values: unknown[]): unknown[] {
  return opened_values.filter(
    (_opened_value: unknown, value_index: number) =>
      value_index in opened_values,
  );
}

function query_sealed(
  context: SealedTableContext,
  data_key: Uint8Array,
  request: DBCoreQueryRequest,
): Promise<DBCoreQueryResponse> {
  return context.down_table.query(request).then((response) =>
    request.values
      ? {
          ...response,
          result: keep_readable_values(
            open_and_report_rows(context, data_key, response.result),
          ),
        }
      : response,
  );
}

function open_sealed_cursor(
  context: SealedTableContext,
  data_key: Uint8Array,
  request: DBCoreOpenCursorRequest,
): ReturnType<DBCoreTable["openCursor"]> {
  return context.down_table
    .openCursor(request)
    .then((cursor) =>
      cursor && request.values
        ? wrap_sealed_cursor(cursor, { ...context, data_key })
        : cursor,
    );
}

export function wrap_sealed_table(context: SealedTableContext): DBCoreTable {
  const { down_table, plan, dependencies } = context;
  const guard = with_local_data_key(dependencies, plan.table_name);
  return {
    ...down_table,
    mutate: (request: DBCoreMutateRequest): Promise<DBCoreMutateResponse> =>
      mutation_needs_data_key(request)
        ? guard(LocalRecordSealingOperation.MUTATE, (data_key: Uint8Array) =>
            mutate_sealed_records(down_table, plan, data_key, request),
          )
        : down_table.mutate(request),
    get: (request: DBCoreGetRequest): Promise<unknown> =>
      guard(LocalRecordSealingOperation.GET, (data_key: Uint8Array) =>
        down_table
          .get(request)
          .then(
            (stored_row: unknown) =>
              open_and_report_rows(context, data_key, [stored_row])[0],
          ),
      ),
    getMany: (request: DBCoreGetManyRequest): Promise<unknown[]> =>
      guard(LocalRecordSealingOperation.GET_MANY, (data_key: Uint8Array) =>
        down_table
          .getMany(request)
          .then((stored_rows: unknown[]) =>
            open_and_report_rows(context, data_key, stored_rows),
          ),
      ),
    query: (request: DBCoreQueryRequest): Promise<DBCoreQueryResponse> =>
      guard(LocalRecordSealingOperation.QUERY, (data_key: Uint8Array) =>
        query_sealed(context, data_key, request),
      ),
    openCursor: (request: DBCoreOpenCursorRequest) =>
      guard(LocalRecordSealingOperation.OPEN_CURSOR, (data_key: Uint8Array) =>
        open_sealed_cursor(context, data_key, request),
      ),
  };
}
