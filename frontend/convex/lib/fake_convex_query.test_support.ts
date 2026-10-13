export type StoredDocument = Record<string, unknown> & { _id: string };

const RangeOperator = {
  EQ: "eq",
  GT: "gt",
  GTE: "gte",
  LT: "lt",
  LTE: "lte",
} as const;

type RangeOperatorValue = (typeof RangeOperator)[keyof typeof RangeOperator];

const SortOrder = { ASC: "asc", DESC: "desc" } as const;

type SortOrderValue = (typeof SortOrder)[keyof typeof SortOrder];

interface RangeCondition {
  field_name: string;
  operator: RangeOperatorValue;
  value: unknown;
}

export interface FakeRangeBuilder {
  conditions: RangeCondition[];
  eq(field_name: string, value: unknown): FakeRangeBuilder;
  gt(field_name: string, value: unknown): FakeRangeBuilder;
  gte(field_name: string, value: unknown): FakeRangeBuilder;
  lt(field_name: string, value: unknown): FakeRangeBuilder;
  lte(field_name: string, value: unknown): FakeRangeBuilder;
}

export interface FakeIndexedQuery {
  first(): Promise<unknown>;
  collect(): Promise<StoredDocument[]>;
  take(limit: number): Promise<StoredDocument[]>;
  order(sort_order: SortOrderValue): FakeIndexedQuery;
}

export interface FakeTableQuery extends FakeIndexedQuery {
  withIndex(
    index_name: string,
    predicate: (builder: FakeRangeBuilder) => FakeRangeBuilder,
  ): FakeIndexedQuery;
}

const CONVEX_EMPTY_LOOKUP_RESULT: unknown = null;

function create_range_builder(conditions: RangeCondition[]): FakeRangeBuilder {
  const append =
    (operator: RangeOperatorValue) =>
    (field_name: string, value: unknown): FakeRangeBuilder =>
      create_range_builder([...conditions, { field_name, operator, value }]);
  return {
    conditions,
    eq: append(RangeOperator.EQ),
    gt: append(RangeOperator.GT),
    gte: append(RangeOperator.GTE),
    lt: append(RangeOperator.LT),
    lte: append(RangeOperator.LTE),
  };
}

function compare_values(left: unknown, right: unknown): number {
  if (left === right) return 0;
  if (left === undefined) return -1;
  if (right === undefined) return 1;
  return (left as number) < (right as number) ? -1 : 1;
}

function matches_condition(
  row: StoredDocument,
  condition: RangeCondition,
): boolean {
  const comparison = compare_values(row[condition.field_name], condition.value);
  switch (condition.operator) {
    case RangeOperator.EQ:
      return comparison === 0;
    case RangeOperator.GT:
      return row[condition.field_name] !== undefined && comparison > 0;
    case RangeOperator.GTE:
      return comparison >= 0;
    case RangeOperator.LT:
      return comparison < 0;
    case RangeOperator.LTE:
      return comparison <= 0;
  }
}

function sort_rows_by_conditions(
  rows: StoredDocument[],
  conditions: RangeCondition[],
): StoredDocument[] {
  const sort_fields = conditions.map((condition) => condition.field_name);
  return [...rows].sort((left, right) => {
    for (const field_name of sort_fields) {
      const comparison = compare_values(left[field_name], right[field_name]);
      if (comparison !== 0) return comparison;
    }
    return 0;
  });
}

function build_indexed_query(rows: StoredDocument[]): FakeIndexedQuery {
  return {
    first: async (): Promise<unknown> =>
      rows.length > 0 ? rows[0] : CONVEX_EMPTY_LOOKUP_RESULT,
    collect: async (): Promise<StoredDocument[]> => [...rows],
    take: async (limit: number): Promise<StoredDocument[]> =>
      rows.slice(0, limit),
    order: (sort_order: SortOrderValue): FakeIndexedQuery =>
      build_indexed_query(
        sort_order === SortOrder.DESC ? [...rows].reverse() : rows,
      ),
  };
}

export function build_table_query(rows: StoredDocument[]): FakeTableQuery {
  return {
    ...build_indexed_query(rows),
    withIndex: (_index_name, predicate): FakeIndexedQuery => {
      const builder = predicate(create_range_builder([]));
      const matching_rows = rows.filter((row) =>
        builder.conditions.every((condition) =>
          matches_condition(row, condition),
        ),
      );
      return build_indexed_query(
        sort_rows_by_conditions(matching_rows, builder.conditions),
      );
    },
  };
}
