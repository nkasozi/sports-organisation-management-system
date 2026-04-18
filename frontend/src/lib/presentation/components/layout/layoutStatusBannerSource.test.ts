import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const MOBILE_STACKED_LAYOUT_PATTERN =
  /flex flex-col items-center gap-0\.5 px-6/;
const TABLET_AND_DESKTOP_LAYOUT_PATTERN =
  /md:flex-row md:flex-wrap md:justify-center md:gap-x-4 md:gap-y-1/;

function read_layout_component_source(relative_path: string): string {
  return readFileSync(new URL(relative_path, import.meta.url), "utf8");
}

describe("layout status banner source contract", () => {
  it("keeps the signed-out banner stacked on mobile and spreads it out from tablet widths upward", () => {
    const layout_status_banner_source = read_layout_component_source(
      "./LayoutStatusBanner.svelte",
    );

    expect(layout_status_banner_source).toMatch(MOBILE_STACKED_LAYOUT_PATTERN);
    expect(layout_status_banner_source).toMatch(
      TABLET_AND_DESKTOP_LAYOUT_PATTERN,
    );
  });
});
