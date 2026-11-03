import { describe, expect, it } from "vitest";

import {
  compute_dropdown_placement,
  DROPDOWN_EDGE,
  format_dropdown_style,
} from "./searchable_select_placement";

const anchor = { top: 100, bottom: 140, left: 20, width: 240 };

describe("compute_dropdown_placement", () => {
  it("opens below the field when there is room", () => {
    expect(compute_dropdown_placement(anchor, 800)).toEqual({
      edge: DROPDOWN_EDGE.TOP,
      offset: 148,
      left: 20,
      width: 240,
      max_height: 256,
    });
  });

  it("opens above the field when there is more room above than below", () => {
    const low_anchor = { top: 700, bottom: 740, left: 20, width: 240 };

    expect(compute_dropdown_placement(low_anchor, 800)).toEqual({
      edge: DROPDOWN_EDGE.BOTTOM,
      offset: 108,
      left: 20,
      width: 240,
      max_height: 256,
    });
  });

  it("shrinks the list to the space available", () => {
    const tight_anchor = { top: 100, bottom: 140, left: 20, width: 240 };

    expect(compute_dropdown_placement(tight_anchor, 260).max_height).toBe(104);
  });
});

describe("format_dropdown_style", () => {
  it("anchors the list to the viewport so clipping parents cannot hide it", () => {
    expect(
      format_dropdown_style({
        edge: DROPDOWN_EDGE.BOTTOM,
        offset: 108,
        left: 20,
        width: 240,
        max_height: 256,
      }),
    ).toBe(
      "position: fixed; bottom: 108px; left: 20px; width: 240px; max-height: 256px",
    );
  });
});
