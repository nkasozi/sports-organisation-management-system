export type SelectOption = {
  value: string;
  label: string;
  color_swatch?: string;
  group?: string;
};

export type GroupedSelectOptions = { group: string; options: SelectOption[] }[];

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
    const normalized_group = (option.group ?? "").toLowerCase();
    return (
      normalized_label.includes(normalized_query) ||
      normalized_value.includes(normalized_query) ||
      normalized_group.includes(normalized_query)
    );
  });
}

export function find_select_option_by_value(
  options: readonly SelectOption[],
  value: string,
): SelectOption | undefined {
  const matched_option = options.find((option) => option.value === value);
  return matched_option;
}

export function clamp_index(index: number, min: number, max: number): number {
  if (index < min) return min;
  if (index > max) return max;
  return index;
}

export function build_grouped_options(
  flat_options: SelectOption[],
): GroupedSelectOptions {
  const has_groups = flat_options.some(
    (option: SelectOption) => option.group && option.group.trim().length > 0,
  );
  if (!has_groups) return [{ group: "", options: flat_options }];

  const group_map = new Map<string, SelectOption[]>();
  for (const option of flat_options) {
    const group_key = option.group ?? "";
    const existing_group = group_map.get(group_key);
    if (existing_group) {
      existing_group.push(option);
      continue;
    }
    group_map.set(group_key, [option]);
  }

  const grouped_options: GroupedSelectOptions = [];
  const sorted_group_keys = Array.from(group_map.keys()).sort(
    (first: string, second: string) => {
      if (first === "") return 1;
      if (second === "") return -1;
      return first.localeCompare(second);
    },
  );
  for (const group_name of sorted_group_keys) {
    const group_options = group_map.get(group_name);
    if (group_options)
      grouped_options.push({ group: group_name, options: group_options });
  }
  return grouped_options;
}

export function get_flat_index_for_grouped(
  groups: GroupedSelectOptions,
  group_index: number,
  option_index: number,
): number {
  let flat_index = 0;
  for (
    let current_group_index = 0;
    current_group_index < group_index;
    current_group_index += 1
  ) {
    flat_index += groups[current_group_index].options.length;
  }
  return flat_index + option_index;
}

export function get_display_input_value(
  is_open: boolean,
  query: string,
  selected_option: SelectOption | undefined,
): string {
  if (is_open) return query;
  return selected_option ? selected_option.label : "";
}

export function get_highlighted_index_for_selected_value(
  filtered_options: SelectOption[],
  selected_value: string,
): number {
  if (selected_value.length === 0) return 0;
  return clamp_index(
    filtered_options.findIndex(
      (option: SelectOption) => option.value === selected_value,
    ),
    0,
    Math.max(0, filtered_options.length - 1),
  );
}

export function focus_input_cursor_to_end(
  input_element: HTMLInputElement | undefined,
): Promise<void> {
  return Promise.resolve().then(() => {
    if (!input_element) return;
    const input_length = input_element.value.length;
    input_element.setSelectionRange(input_length, input_length);
  });
}

export function get_next_highlighted_index(
  highlighted_index: number,
  offset: number,
  filtered_option_count: number,
): number {
  return clamp_index(
    highlighted_index + offset,
    0,
    Math.max(0, filtered_option_count - 1),
  );
}

export function should_close_dropdown_from_pointer(
  container_element: HTMLDivElement | undefined,
  target_node: Node | undefined,
  is_open: boolean,
): boolean {
  if (!target_node || !container_element || !is_open) return false;
  return !container_element.contains(target_node);
}
