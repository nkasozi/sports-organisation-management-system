import type { SelectOption } from "./searchable_select_logic";

interface NamedSelectRecord {
  id: string;
  name: string;
}

interface NumericSelectOption {
  value: number;
  label: string;
}

export function build_named_record_options(
  records: readonly NamedSelectRecord[],
): SelectOption[] {
  return records.map((record: NamedSelectRecord) => ({
    value: record.id,
    label: record.name,
  }));
}

export function build_named_record_options_with_blank(
  blank_label: string,
  records: readonly NamedSelectRecord[],
): SelectOption[] {
  return [
    { value: "", label: blank_label },
    ...build_named_record_options(records),
  ];
}

export function build_numeric_select_options(
  options: readonly NumericSelectOption[],
): SelectOption[] {
  return options.map((option: NumericSelectOption) => ({
    value: String(option.value),
    label: option.label,
  }));
}

export function parse_numeric_select_value(selected_value: string): number {
  return Number(selected_value);
}

export function keep_first_option_per_value(
  options: readonly SelectOption[],
): SelectOption[] {
  const seen_values = new Set<string>();
  return options.filter((option: SelectOption) => {
    if (seen_values.has(option.value)) return false;
    seen_values.add(option.value);
    return true;
  });
}
