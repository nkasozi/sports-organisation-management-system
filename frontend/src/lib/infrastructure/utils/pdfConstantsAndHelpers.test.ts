import { describe, expect, it, vi } from "vitest";

import {
  draw_color_swatch,
  parse_hex_color,
  truncate_text,
} from "./pdfConstantsAndHelpers";

describe("pdfConstantsAndHelpers", () => {
  it("truncates text and parses hex colors with fallbacks", () => {
    expect(truncate_text("Short", 10)).toBe("Short");
    expect(truncate_text("Longer text", 8)).toBe("Longer..");
    expect(parse_hex_color("#112233")).toEqual({ r: 17, g: 34, b: 51 });
    expect(parse_hex_color("zzzzzz")).toEqual({ r: 128, g: 128, b: 128 });
  });

  it("draws a color swatch onto a jsPDF-like document", () => {
    const set_fill_color = vi.fn();
    const set_draw_color = vi.fn();
    const rect = vi.fn();

    expect(
      draw_color_swatch(
        {
          setFillColor: set_fill_color,
          setDrawColor: set_draw_color,
          rect,
        } as never,
        "#112233",
        10,
        20,
        5,
        6,
      ),
    ).toBe(true);
    expect(set_fill_color).toHaveBeenCalledWith(17, 34, 51);
    expect(set_draw_color).toHaveBeenCalledWith(0, 0, 0);
    expect(rect).toHaveBeenCalledWith(10, 15, 5, 6, "FD");
  });
});
