import { describe, expect, it } from "vitest";

import { get_next_help_section_state } from "./helpPageState";

describe("get_next_help_section_state", () => {
  it("expands the selected index when nothing is expanded", () => {
    expect(get_next_help_section_state({ status: "collapsed" }, 2)).toEqual({
      status: "expanded",
      index: 2,
    });
  });

  it("collapses the selected index when it is already expanded", () => {
    expect(
      get_next_help_section_state({ status: "expanded", index: 2 }, 2),
    ).toEqual({ status: "collapsed" });
  });

  it("switches to the new index when a different item is expanded", () => {
    expect(
      get_next_help_section_state({ status: "expanded", index: 1 }, 4),
    ).toEqual({
      status: "expanded",
      index: 4,
    });
  });
});
