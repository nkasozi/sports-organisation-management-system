import { describe, expect, it } from "vitest";

import { get_next_help_section_index } from "./helpPageState";

describe("get_next_help_section_index", () => {
  it("returns the selected index when nothing is expanded", () => {
    expect(get_next_help_section_index(null, 2)).toBe(2);
  });

  it("collapses the selected index when it is already expanded", () => {
    expect(get_next_help_section_index(2, 2)).toBeNull();
  });

  it("switches to the new index when a different item is expanded", () => {
    expect(get_next_help_section_index(1, 4)).toBe(4);
  });
});
