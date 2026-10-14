import type { QueryCtx } from "../_generated/server";

export type StoredRow = Record<string, unknown>;

export interface DynamicIndexRange {
  eq(field_name: string, value: unknown): DynamicIndexRange;
  gt(field_name: string, value: unknown): DynamicIndexRange;
  gte(field_name: string, value: unknown): DynamicIndexRange;
  lt(field_name: string, value: unknown): DynamicIndexRange;
}

interface DynamicOrderedQuery {
  collect(): Promise<StoredRow[]>;
  take(limit: number): Promise<StoredRow[]>;
  first(): Promise<unknown>;
}

interface DynamicIndexedQuery extends DynamicOrderedQuery {
  order(direction: "asc" | "desc"): DynamicOrderedQuery;
}

interface DynamicTableQuery extends DynamicOrderedQuery {
  withIndex(
    index_name: string,
    range: (builder: DynamicIndexRange) => DynamicIndexRange,
  ): DynamicIndexedQuery;
}

export function query_table_dynamically(
  ctx: { db: QueryCtx["db"] },
  table_name: string,
): DynamicTableQuery {
  return ctx.db.query(table_name as never) as unknown as DynamicTableQuery;
}
