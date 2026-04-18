import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const CIRCULAR_LOGO_WRAPPER_PATTERN =
  /h-8 w-8(?: shrink-0)? rounded-full flex items-center justify-center overflow-hidden/;
const LEGACY_SQUARE_LOGO_WRAPPER_PATTERN =
  /h-8 w-8(?: shrink-0)? rounded-lg flex items-center justify-center overflow-hidden/;

function read_layout_component_source(relative_path: string): string {
  return readFileSync(new URL(relative_path, import.meta.url), "utf8");
}

describe("organization logo shape", () => {
  it("uses circular wrappers for organization logos across layout surfaces", () => {
    const header_brand_panel_source = read_layout_component_source(
      "./HeaderBrandPanel.svelte",
    );
    const sidebar_header_source = read_layout_component_source(
      "./SidebarHeader.svelte",
    );
    const footer_brand_panel_source = read_layout_component_source(
      "./FooterBrandPanel.svelte",
    );
    const public_header_source = read_layout_component_source(
      "./PublicHeader.svelte",
    );

    expect(header_brand_panel_source).toMatch(CIRCULAR_LOGO_WRAPPER_PATTERN);
    expect(sidebar_header_source).toMatch(CIRCULAR_LOGO_WRAPPER_PATTERN);
    expect(footer_brand_panel_source).toMatch(CIRCULAR_LOGO_WRAPPER_PATTERN);
    expect(public_header_source).toMatch(CIRCULAR_LOGO_WRAPPER_PATTERN);

    expect(header_brand_panel_source).not.toMatch(
      LEGACY_SQUARE_LOGO_WRAPPER_PATTERN,
    );
    expect(sidebar_header_source).not.toMatch(
      LEGACY_SQUARE_LOGO_WRAPPER_PATTERN,
    );
    expect(footer_brand_panel_source).not.toMatch(
      LEGACY_SQUARE_LOGO_WRAPPER_PATTERN,
    );
    expect(public_header_source).not.toMatch(
      LEGACY_SQUARE_LOGO_WRAPPER_PATTERN,
    );
  });
});
