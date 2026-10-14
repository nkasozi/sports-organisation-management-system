const UNDEFINED_TYPE_NAME = "undefined";

interface ClearedFieldSplit {
  data: Record<string, unknown>;
  cleared_fields: string[];
}

function is_cleared_value(value: unknown): boolean {
  return typeof value === UNDEFINED_TYPE_NAME;
}

export function split_cleared_fields(
  record: Record<string, unknown>,
): ClearedFieldSplit {
  const entries = Object.entries(record);
  return {
    data: Object.fromEntries(
      entries.filter(([, value]) => !is_cleared_value(value)),
    ),
    cleared_fields: entries
      .filter(([, value]) => is_cleared_value(value))
      .map(([field_name]) => field_name),
  };
}

export function attach_cleared_fields<TRecord extends object>(
  record: TRecord,
  cleared_fields: string[],
): TRecord | (TRecord & { cleared_fields: string[] }) {
  return cleared_fields.length > 0 ? { ...record, cleared_fields } : record;
}
