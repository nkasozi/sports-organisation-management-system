const HELP_SECTION_STATUS = {
  COLLAPSED: "collapsed",
  EXPANDED: "expanded",
} as const;

export type HelpSectionExpansionState =
  | { status: typeof HELP_SECTION_STATUS.COLLAPSED }
  | { status: typeof HELP_SECTION_STATUS.EXPANDED; index: number };

export function get_next_help_section_state(
  current_state: HelpSectionExpansionState,
  selected_index: number,
): HelpSectionExpansionState {
  switch (current_state.status) {
    case HELP_SECTION_STATUS.EXPANDED:
      return current_state.index === selected_index
        ? { status: HELP_SECTION_STATUS.COLLAPSED }
        : { status: HELP_SECTION_STATUS.EXPANDED, index: selected_index };
    case HELP_SECTION_STATUS.COLLAPSED:
      return { status: HELP_SECTION_STATUS.EXPANDED, index: selected_index };
  }
}
