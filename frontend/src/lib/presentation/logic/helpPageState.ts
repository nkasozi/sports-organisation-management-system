export type HelpSectionExpansionState =
  | { status: "collapsed" }
  | { status: "expanded"; index: number };

export function get_next_help_section_state(
  current_state: HelpSectionExpansionState,
  selected_index: number,
): HelpSectionExpansionState {
  if (
    current_state.status === "expanded" &&
    current_state.index === selected_index
  ) {
    return { status: "collapsed" };
  }

  return { status: "expanded", index: selected_index };
}
