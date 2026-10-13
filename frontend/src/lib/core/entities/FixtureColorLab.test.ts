import { describe, expect, it } from "vitest";

import { calculate_delta_e, extract_hex, hex_to_lab } from "./FixtureColorLab";

describe("FixtureColorLab", () => {
  it("normalizes hex color strings", () => {
    expect(extract_hex(" #ABCDEF ")).toBe("#abcdef");
    expect(extract_hex("ABCDEF")).toBe("#abcdef");
    expect(extract_hex("abc")).toBe("#abc");
    expect(extract_hex("Red")).toBe("Red");
  });

  it("converts white and black to CIELAB lightness bounds", () => {
    const white = hex_to_lab("#ffffff");
    const black = hex_to_lab("#000");

    expect(white.status === "valid" && white.lab_color.l).toBeCloseTo(100, 3);
    expect(black.status === "valid" && black.lab_color.l).toBeCloseTo(0, 6);
  });

  it("rejects malformed hex values", () => {
    expect(hex_to_lab("#12345")).toEqual({ status: "invalid" });
    expect(hex_to_lab("#gggggg")).toEqual({ status: "invalid" });
  });

  it("computes delta E or reports invalid input", () => {
    const delta = calculate_delta_e("#ffffff", "000000");

    expect(delta.status === "valid" && delta.delta_e).toBeCloseTo(100, 3);
    expect(calculate_delta_e("blue", "#000000")).toEqual({ status: "invalid" });
  });
});
