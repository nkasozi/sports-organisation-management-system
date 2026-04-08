import { describe, expect, it } from "vitest";

import { create_color_palette } from "./themeColorPaletteFactory";

describe("themeColorPaletteFactory", () => {
  it("maps the eleven configured shades into a ColorPalette object", () => {
    const shades = [
      "#f9fafb",
      "#f3f4f6",
      "#e5e7eb",
      "#d1d5db",
      "#9ca3af",
      "#6b7280",
      "#4b5563",
      "#374151",
      "#1f2937",
      "#111827",
      "#030712",
    ] as const;

    expect(create_color_palette([...shades])).toEqual({
      50: "#f9fafb",
      100: "#f3f4f6",
      200: "#e5e7eb",
      300: "#d1d5db",
      400: "#9ca3af",
      500: "#6b7280",
      600: "#4b5563",
      700: "#374151",
      800: "#1f2937",
      900: "#111827",
      950: "#030712",
    });
  });
});
