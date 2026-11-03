import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const FIELD_WRAPPER_PATTERN =
  /<div bind:this=\{container_element\} class="[^"]*\brelative\b[^"]*">/;
const VIEWPORT_PLACED_PANEL_PATTERN =
  /style=\{format_dropdown_style\(placement\)\}/;
const FIELD_MEASURED_PLACEMENT_PATTERN = /anchor_element=\{input_element\}/;

function read_component_source(relative_path: string): string {
  return readFileSync(new URL(relative_path, import.meta.url), "utf8");
}

describe("searchable dropdown width source contract", () => {
  it("sizes and places the option panel from its own field", () => {
    expect(read_component_source("./SearchableSelectDropdown.svelte")).toMatch(
      VIEWPORT_PLACED_PANEL_PATTERN,
    );
    expect(read_component_source("./SearchableSelectField.svelte")).toMatch(
      FIELD_MEASURED_PLACEMENT_PATTERN,
    );
    expect(read_component_source("./SearchableSelectField.svelte")).toMatch(
      FIELD_WRAPPER_PATTERN,
    );
  });
});
