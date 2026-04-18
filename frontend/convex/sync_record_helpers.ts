export function has_meaningful_changes(
  local_data: Record<string, unknown>,
  remote_data: Record<string, unknown>,
): boolean {
  const excluded_fields = new Set([
    "id",
    "local_id",
    "_id",
    "_creationTime",
    "created_at",
    "updated_at",
    "synced_at",
    "version",
  ]);
  for (const key of Object.keys(local_data)) {
    if (excluded_fields.has(key)) continue;
    if (!values_equal(local_data[key], remote_data[key])) return true;
  }
  return false;
}

const NULL_VALUE_TAG = "[object Null]";
const UNDEFINED_VALUE_TAG = "[object Undefined]";
const OBJECT_VALUE_TAG = "[object Object]";

function get_value_tag(value: unknown): string {
  return Object.prototype.toString.call(value);
}

function is_absent_value(value: unknown): boolean {
  const value_tag = get_value_tag(value);
  return value_tag === NULL_VALUE_TAG || value_tag === UNDEFINED_VALUE_TAG;
}

function is_plain_object(value: unknown): value is Record<string, unknown> {
  return get_value_tag(value) === OBJECT_VALUE_TAG;
}

function values_equal(a: unknown, b: unknown): boolean {
  if (a === b || (is_absent_value(a) && is_absent_value(b))) return true;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) && Array.isArray(b))
    return (
      a.length === b.length &&
      a.every((value, index) => values_equal(value, b[index]))
    );
  if (is_plain_object(a) && is_plain_object(b)) {
    const a_object = a as Record<string, unknown>;
    const b_object = b as Record<string, unknown>;
    const a_keys = Object.keys(a_object);
    const b_keys = Object.keys(b_object);
    return (
      a_keys.length === b_keys.length &&
      a_keys.every((key) => values_equal(a_object[key], b_object[key]))
    );
  }
  return false;
}

export function strip_convex_fields(
  record: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (key !== "_id" && key !== "_creationTime") result[key] = value;
  }
  return result;
}
