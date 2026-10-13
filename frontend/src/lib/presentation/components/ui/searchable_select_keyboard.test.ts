import { describe, expect, it } from "vitest";

import {
  resolve_searchable_select_key_action,
  SearchableSelectKeyActionKind,
} from "./searchable_select_keyboard";

const OPTIONS = [
  { value: "a", label: "A" },
  { value: "b", label: "B" },
  { value: "c", label: "C" },
];

function resolve(
  key: string,
  is_open: boolean,
  highlighted_index = 0,
): unknown {
  return resolve_searchable_select_key_action({
    key,
    is_open,
    highlighted_index,
    filtered_options: OPTIONS,
  });
}

describe("resolve_searchable_select_key_action", () => {
  it("closes on Escape regardless of open state", () => {
    expect(resolve("Escape", false)).toEqual({
      action: { kind: SearchableSelectKeyActionKind.CLOSE },
      should_prevent_default: true,
    });
  });

  it("opens a closed dropdown on arrow keys", () => {
    expect(resolve("ArrowDown", false)).toEqual({
      action: { kind: SearchableSelectKeyActionKind.OPEN },
      should_prevent_default: true,
    });
    expect(resolve("ArrowUp", false)).toEqual({
      action: { kind: SearchableSelectKeyActionKind.OPEN },
      should_prevent_default: true,
    });
  });

  it("moves and clamps the highlight on arrow keys when open", () => {
    expect(resolve("ArrowDown", true, 1)).toEqual({
      action: { kind: SearchableSelectKeyActionKind.HIGHLIGHT, index: 2 },
      should_prevent_default: true,
    });
    expect(resolve("ArrowDown", true, 2)).toEqual({
      action: { kind: SearchableSelectKeyActionKind.HIGHLIGHT, index: 2 },
      should_prevent_default: true,
    });
    expect(resolve("ArrowUp", true, 0)).toEqual({
      action: { kind: SearchableSelectKeyActionKind.HIGHLIGHT, index: 0 },
      should_prevent_default: true,
    });
  });

  it("closes on Tab only when open without preventing default", () => {
    expect(resolve("Tab", true)).toEqual({
      action: { kind: SearchableSelectKeyActionKind.CLOSE },
      should_prevent_default: false,
    });
    expect(resolve("Tab", false)).toEqual({
      action: { kind: SearchableSelectKeyActionKind.NONE },
      should_prevent_default: false,
    });
  });

  it("opens on Enter when closed and commits the highlight when open", () => {
    expect(resolve("Enter", false)).toEqual({
      action: { kind: SearchableSelectKeyActionKind.OPEN },
      should_prevent_default: false,
    });
    expect(resolve("Enter", true, 1)).toEqual({
      action: { kind: SearchableSelectKeyActionKind.COMMIT, value: "b" },
      should_prevent_default: true,
    });
    expect(resolve("Enter", true, 9)).toEqual({
      action: { kind: SearchableSelectKeyActionKind.NONE },
      should_prevent_default: true,
    });
  });

  it("ignores unrelated keys", () => {
    expect(resolve("a", true)).toEqual({
      action: { kind: SearchableSelectKeyActionKind.NONE },
      should_prevent_default: false,
    });
  });
});
