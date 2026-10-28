const JavaScriptTypeName = {
  STRING: "string",
  NUMBER: "number",
  BOOLEAN: "boolean",
  OBJECT: "object",
} as const;

export function is_string(value: unknown): value is string {
  return typeof value === JavaScriptTypeName.STRING;
}

export function is_non_empty_string(value: unknown): value is string {
  return is_string(value) && value.trim().length > 0;
}

export function is_boolean(value: unknown): value is boolean {
  return typeof value === JavaScriptTypeName.BOOLEAN;
}

export function is_number(value: unknown): value is number {
  return typeof value === JavaScriptTypeName.NUMBER;
}

export function is_object_record(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === JavaScriptTypeName.OBJECT &&
    Boolean(value) &&
    !Array.isArray(value)
  );
}

export function read_string_or(value: unknown, missing_value: string): string {
  return is_string(value) ? value : missing_value;
}
