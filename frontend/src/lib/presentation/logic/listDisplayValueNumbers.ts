import { is_number_value } from "./runtimeTypeGuards";

const LIST_NUMBER_LOCALE = "en-US";
const UNGROUPED_NUMBER_FIELD_PATTERN =
  /(year|number|jersey|order|code|minute|_id$)/;

const list_number_formatter = new Intl.NumberFormat(LIST_NUMBER_LOCALE);

export function should_group_list_number(
  field_name: string,
  raw_value: unknown,
): boolean {
  if (!is_number_value(raw_value)) return false;
  if (!Number.isFinite(raw_value)) return false;
  return !UNGROUPED_NUMBER_FIELD_PATTERN.test(field_name);
}

export function format_list_number(raw_value: number): string {
  return list_number_formatter.format(raw_value);
}
