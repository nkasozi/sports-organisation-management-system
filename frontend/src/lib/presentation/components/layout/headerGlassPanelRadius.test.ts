import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const GLASS_PANEL_RADIUS_CLASS = "rounded-[0.175rem]";
const LEGACY_GLASS_PANEL_RADIUS_CLASS = "backdrop-blur-sm rounded-lg";

function read_layout_component_source(relative_path: string): string {
  return readFileSync(new URL(relative_path, import.meta.url), "utf8");
}

describe("header glass panel radius", () => {
  it("uses the compact glass radius across authenticated and public header panels", () => {
    const header_brand_panel_source = read_layout_component_source(
      "./HeaderBrandPanel.svelte",
    );
    const header_account_panel_source = read_layout_component_source(
      "./HeaderAccountPanel.svelte",
    );
    const public_header_source = read_layout_component_source(
      "./PublicHeader.svelte",
    );

    expect(header_brand_panel_source).toContain(GLASS_PANEL_RADIUS_CLASS);
    expect(header_account_panel_source).toContain(GLASS_PANEL_RADIUS_CLASS);
    expect(public_header_source).toContain(GLASS_PANEL_RADIUS_CLASS);

    expect(header_brand_panel_source).not.toContain(
      LEGACY_GLASS_PANEL_RADIUS_CLASS,
    );
    expect(header_account_panel_source).not.toContain(
      LEGACY_GLASS_PANEL_RADIUS_CLASS,
    );
    expect(public_header_source).not.toContain(LEGACY_GLASS_PANEL_RADIUS_CLASS);
  });
});
