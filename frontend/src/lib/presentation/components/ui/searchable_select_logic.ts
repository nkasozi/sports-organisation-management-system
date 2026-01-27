export type SelectOption = {
  value: string;
  label: string;
  color_swatch?: string;
};

export function normalize_select_query(query: string): string {
  return query.trim().toLowerCase();
}

export function filter_select_options(
  options: readonly SelectOption[],
  query: string,
): SelectOption[] {
  const normalized_query = normalize_select_query(query);
  if (normalized_query.length === 0) return [...options];

  return options.filter((option) => {
    const normalized_label = option.label.toLowerCase();
    const normalized_value = option.value.toLowerCase();
    return (
      normalized_label.includes(normalized_query) ||
      normalized_value.includes(normalized_query)
    );
  });
}

export function find_select_option_by_value(
  options: readonly SelectOption[],
  value: string,
): SelectOption | null {
  const matched_option = options.find((option) => option.value === value);
  return matched_option ?? null;
}

export function clamp_index(index: number, min: number, max: number): number {
  if (index < min) return min;
  if (index > max) return max;
  return index;
}
