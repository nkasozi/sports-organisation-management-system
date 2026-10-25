type AuditRecord = Readonly<Record<string, unknown>>;

const BOOKKEEPING_FIELDS: ReadonlySet<string> = new Set([
  "id",
  "created_at",
  "updated_at",
  "local_id",
  "synced_at",
  "version",
  "sync_sequence",
]);
const VALUE_TYPE = {
  OBJECT_TAG: "[object Object]",
  BOOLEAN: "boolean",
  NUMBER: "number",
  STRING: "string",
} as const;
export const NO_VALUE = "";
const EMBEDDED_DATA_PREFIX = "data:";
const EMBEDDED_DATA_LABEL = "(image)";
const MAX_VALUE_LENGTH = 120;
const ELLIPSIS = "…";
const REFERENCE_SUFFIX_PATTERN = /_id$/;

export function is_tracked_field(field_name: string): boolean {
  return !BOOKKEEPING_FIELDS.has(field_name) && !field_name.startsWith("_");
}

export function humanize_field_name(field_name: string): string {
  const words = field_name
    .replace(REFERENCE_SUFFIX_PATTERN, "")
    .replace(/_/g, " ")
    .trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function is_plain_object(value: unknown): value is AuditRecord {
  return Object.prototype.toString.call(value) === VALUE_TYPE.OBJECT_TAG;
}

export function format_object(record: AuditRecord): string {
  return Object.entries(record)
    .filter(
      ([key, value]) =>
        is_tracked_field(key) && format_value(value) !== NO_VALUE,
    )
    .map(
      ([key, value]) => `${humanize_field_name(key)}: ${format_value(value)}`,
    )
    .join("; ");
}

export function format_value(value: unknown): string {
  if (Array.isArray(value)) return value.map(format_value).join(", ");
  if (is_plain_object(value)) return format_object(value);
  if (typeof value === VALUE_TYPE.BOOLEAN) return value ? "Yes" : "No";
  if (typeof value === VALUE_TYPE.NUMBER || typeof value === VALUE_TYPE.STRING)
    return shorten(String(value));
  return NO_VALUE;
}

function shorten(text: string): string {
  if (text.startsWith(EMBEDDED_DATA_PREFIX)) return EMBEDDED_DATA_LABEL;
  return text.length > MAX_VALUE_LENGTH
    ? `${text.slice(0, MAX_VALUE_LENGTH)}${ELLIPSIS}`
    : text;
}
