import type { HelpSectionExpansionState } from "$lib/presentation/logic/helpPageState";

const HELP_SECTION_EXPANSION_STATUS = {
  COLLAPSED: "collapsed",
  EXPANDED: "expanded",
} as const satisfies Record<string, HelpSectionExpansionState["status"]>;

export function is_help_section_item_expanded(
  expansion_state: HelpSectionExpansionState,
  selected_index: number,
): boolean {
  switch (expansion_state.status) {
    case HELP_SECTION_EXPANSION_STATUS.EXPANDED:
      return expansion_state.index === selected_index;
    case HELP_SECTION_EXPANSION_STATUS.COLLAPSED:
      return false;
  }
}
