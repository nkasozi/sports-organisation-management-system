export function get_next_help_section_index(
  current_expanded_index: number | null,
  selected_index: number,
): number | null {
  return current_expanded_index === selected_index ? null : selected_index;
}
