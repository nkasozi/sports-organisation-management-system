export function is_string_value(value: unknown): value is string {
  return typeof value === typeof "";
}

export function is_number_value(value: unknown): value is number {
  return typeof value === typeof 0;
}

export function is_boolean_value(value: unknown): value is boolean {
  return typeof value === typeof true;
}

export function is_absent_value(value: unknown): boolean {
  return typeof value === typeof undefined;
}

export function is_object_value(value: unknown): value is object {
  return typeof value === typeof {} && Boolean(value);
}

export function is_blank_string_value(value: unknown): boolean {
  return !is_string_value(value) || value.trim().length === 0;
}
