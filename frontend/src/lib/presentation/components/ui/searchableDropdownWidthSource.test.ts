import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const FIELD_WRAPPER_PATTERN =
  /<div bind:this=\{container_element\} class="[^"]*\brelative\b[^"]*">/;
const FULL_WIDTH_PANEL_PATTERN = /class="absolute [^"]*\bw-full\b/;

function read_component_source(relative_path: string): string {
  return readFileSync(new URL(relative_path, import.meta.url), "utf8");
}

describe("searchable dropdown width source contract", () => {
  it("anchors the full-width option panel to its own field", () => {
    expect(read_component_source("./SearchableSelectDropdown.svelte")).toMatch(
      FULL_WIDTH_PANEL_PATTERN,
    );
    expect(read_component_source("./SearchableSelectField.svelte")).toMatch(
      FIELD_WRAPPER_PATTERN,
    );
  });
});
