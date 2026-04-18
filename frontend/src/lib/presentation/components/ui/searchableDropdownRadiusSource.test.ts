import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const SEARCHABLE_DROPDOWN_RADIUS_CLASS = "rounded-[0.175rem]";
const LEGACY_SEARCHABLE_DROPDOWN_RADIUS_CLASS = /\brounded-lg\b/;

const SOURCE_FILES = [
  "./SearchableSelectInput.svelte",
  "./SearchableSelectDropdown.svelte",
] as const;

function read_component_source(relative_path: string): string {
  return readFileSync(new URL(relative_path, import.meta.url), "utf8");
}

describe("searchable dropdown radius source contract", () => {
  it("uses the shared 0.175rem radius across the searchable select input and dropdown panel", () => {
    for (const source_file of SOURCE_FILES) {
      const source = read_component_source(source_file);

      expect(source).toContain(SEARCHABLE_DROPDOWN_RADIUS_CLASS);
      expect(source).not.toMatch(LEGACY_SEARCHABLE_DROPDOWN_RADIUS_CLASS);
    }
  });
});
