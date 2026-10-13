import { describe, expect, it } from "vitest";

import { is_help_section_item_expanded } from "./helpSectionConstants";

describe("is_help_section_item_expanded", () => {
  it("returns true only for the expanded index", () => {
    const expanded_state = { status: "expanded", index: 2 } as const;

    expect(is_help_section_item_expanded(expanded_state, 2)).toBe(true);
    expect(is_help_section_item_expanded(expanded_state, 1)).toBe(false);
  });

  it("returns false when the section is collapsed", () => {
    expect(is_help_section_item_expanded({ status: "collapsed" }, 0)).toBe(
      false,
    );
  });
});
