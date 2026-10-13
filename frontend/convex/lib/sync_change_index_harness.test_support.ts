import schema from "../schema";
import type { FakeConvexContext } from "./fake_convex_context.test_support";
import {
  build_table_query,
  type FakeIndexedQuery,
  type FakeRangeBuilder,
  type FakeTableQuery,
  type StoredDocument,
} from "./fake_convex_query.test_support";

interface SchemaIndex {
  indexDescriptor: string;
  fields: string[];
}

const DESCENDING_ORDER = "desc";
const CONVEX_EMPTY_LOOKUP_RESULT: unknown = JSON.parse("null");
const TypeRank = { MISSING: 0, NUMBER: 1, STRING: 2, OTHER: 3 } as const;

function read_index_fields(table_name: string, index_name: string): string[] {
  const table_definition = (
    schema.tables as unknown as Record<
      string,
      { " indexes"(): SchemaIndex[] } | undefined
    >
  )[table_name];
  if (!table_definition) return [];
  const index = table_definition[" indexes"]().find(
    (candidate) => candidate.indexDescriptor === index_name,
  );
  return index ? index.fields : [];
}

function rank_value(value: unknown): number {
  switch (typeof value) {
    case "undefined":
      return TypeRank.MISSING;
    case "number":
      return TypeRank.NUMBER;
    case "string":
      return TypeRank.STRING;
    case "bigint":
    case "boolean":
    case "symbol":
    case "object":
    case "function":
      return TypeRank.OTHER;
  }
}

function compare_index_values(left: unknown, right: unknown): number {
  const rank_difference = rank_value(left) - rank_value(right);
  if (rank_difference !== 0 || left === right) return rank_difference;
  return (left as number | string) < (right as number | string) ? -1 : 1;
}

function sort_by_index(
  rows: StoredDocument[],
  index_fields: string[],
): StoredDocument[] {
  return [...rows].sort((left, right) => {
    for (const field_name of index_fields) {
      const comparison = compare_index_values(
        left[field_name],
        right[field_name],
      );
      if (comparison !== 0) return comparison;
    }
    return 0;
  });
}

function build_ordered_query(rows: StoredDocument[]): FakeIndexedQuery {
  return {
    first: async (): Promise<unknown> =>
      rows.length > 0 ? rows[0] : CONVEX_EMPTY_LOOKUP_RESULT,
    collect: async (): Promise<StoredDocument[]> => [...rows],
    take: async (limit: number): Promise<StoredDocument[]> =>
      rows.slice(0, limit),
    order: (sort_order: string): FakeIndexedQuery =>
      build_ordered_query(
        sort_order === DESCENDING_ORDER ? [...rows].reverse() : rows,
      ),
  };
}

function build_index_ordered_table_query(
  table_name: string,
  rows: StoredDocument[],
): FakeTableQuery {
  const unordered_query = build_table_query(rows);
  return {
    ...unordered_query,
    withIndex: (
      index_name: string,
      predicate: (builder: FakeRangeBuilder) => FakeRangeBuilder,
    ): FakeIndexedQuery => {
      const matching_rows = rows.filter((row) =>
        predicate(build_probe_builder()).conditions.every((condition) =>
          matches_probe(row, condition),
        ),
      );
      return build_ordered_query(
        sort_by_index(matching_rows, read_index_fields(table_name, index_name)),
      );
    },
  };
}

type ProbeCondition = FakeRangeBuilder["conditions"][number];

function build_probe_builder(
  conditions: ProbeCondition[] = [],
): FakeRangeBuilder {
  const append =
    (operator: ProbeCondition["operator"]) =>
    (field_name: string, value: unknown): FakeRangeBuilder =>
      build_probe_builder([...conditions, { field_name, operator, value }]);
  return {
    conditions,
    eq: append("eq"),
    gt: append("gt"),
    gte: append("gte"),
    lt: append("lt"),
    lte: append("lte"),
  };
}

function matches_probe(
  row: StoredDocument,
  condition: ProbeCondition,
): boolean {
  const comparison = compare_index_values(
    row[condition.field_name],
    condition.value,
  );
  switch (condition.operator) {
    case "eq":
      return comparison === 0;
    case "gt":
      return comparison > 0;
    case "gte":
      return comparison >= 0;
    case "lt":
      return comparison < 0;
    case "lte":
      return comparison <= 0;
  }
}

export function with_schema_index_ordering(
  context: FakeConvexContext,
): FakeConvexContext {
  return {
    ...context,
    db: {
      ...context.db,
      query: (table_name: string): FakeTableQuery => {
        const rows = context.tables.get(table_name) ?? [];
        context.tables.set(table_name, rows);
        return build_index_ordered_table_query(table_name, rows);
      },
    },
  };
}
