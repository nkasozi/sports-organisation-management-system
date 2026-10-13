export function is_string_value(value: unknown): value is string {
  return typeof value === typeof "";
}

export function is_number_value(value: unknown): value is number {
  return typeof value === typeof 0;
}

function is_object_value(value: unknown): value is object {
  return typeof value === typeof {} && Boolean(value);
}

export function is_record_value(
  value: unknown,
): value is Record<string, unknown> {
  return is_object_value(value) && !Array.isArray(value);
}
