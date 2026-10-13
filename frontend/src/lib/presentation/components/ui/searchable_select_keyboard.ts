import { KEYBOARD_KEY } from "./keyboardKeys";
import {
  get_next_highlighted_index,
  type SelectOption,
} from "./searchable_select_logic";

export enum SearchableSelectKeyActionKind {
  NONE = "none",
  OPEN = "open",
  CLOSE = "close",
  HIGHLIGHT = "highlight",
  COMMIT = "commit",
}

export type SearchableSelectKeyAction =
  | { kind: SearchableSelectKeyActionKind.NONE }
  | { kind: SearchableSelectKeyActionKind.OPEN }
  | { kind: SearchableSelectKeyActionKind.CLOSE }
  | { kind: SearchableSelectKeyActionKind.HIGHLIGHT; index: number }
  | { kind: SearchableSelectKeyActionKind.COMMIT; value: string };

type SearchableSelectKeyResolution = {
  action: SearchableSelectKeyAction;
  should_prevent_default: boolean;
};

type SearchableSelectKeyInput = {
  key: string;
  is_open: boolean;
  highlighted_index: number;
  filtered_options: SelectOption[];
};

const NO_ACTION: SearchableSelectKeyAction = {
  kind: SearchableSelectKeyActionKind.NONE,
};
const OPEN_ACTION: SearchableSelectKeyAction = {
  kind: SearchableSelectKeyActionKind.OPEN,
};
const CLOSE_ACTION: SearchableSelectKeyAction = {
  kind: SearchableSelectKeyActionKind.CLOSE,
};

function resolve_arrow_key(
  input: SearchableSelectKeyInput,
  offset: number,
): SearchableSelectKeyResolution {
  if (!input.is_open)
    return { action: OPEN_ACTION, should_prevent_default: true };
  return {
    action: {
      kind: SearchableSelectKeyActionKind.HIGHLIGHT,
      index: get_next_highlighted_index(
        input.highlighted_index,
        offset,
        input.filtered_options.length,
      ),
    },
    should_prevent_default: true,
  };
}

function resolve_enter_key(
  input: SearchableSelectKeyInput,
): SearchableSelectKeyResolution {
  if (!input.is_open)
    return { action: OPEN_ACTION, should_prevent_default: false };
  const option = input.filtered_options[input.highlighted_index];
  return {
    action: option
      ? { kind: SearchableSelectKeyActionKind.COMMIT, value: option.value }
      : NO_ACTION,
    should_prevent_default: true,
  };
}

export function resolve_searchable_select_key_action(
  input: SearchableSelectKeyInput,
): SearchableSelectKeyResolution {
  switch (input.key) {
    case KEYBOARD_KEY.ESCAPE:
      return { action: CLOSE_ACTION, should_prevent_default: true };
    case KEYBOARD_KEY.ARROW_DOWN:
      return resolve_arrow_key(input, 1);
    case KEYBOARD_KEY.ARROW_UP:
      return resolve_arrow_key(input, -1);
    case KEYBOARD_KEY.TAB:
      return {
        action: input.is_open ? CLOSE_ACTION : NO_ACTION,
        should_prevent_default: false,
      };
    case KEYBOARD_KEY.ENTER:
      return resolve_enter_key(input);
    default:
      return { action: NO_ACTION, should_prevent_default: false };
  }
}
