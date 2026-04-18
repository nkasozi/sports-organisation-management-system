import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const DROPDOWN_RADIUS_DECLARATION = "border-radius: 0.175rem;";
const LEGACY_INLINE_SELECT_RADIUS_CLASS_PATTERN =
  /<select(?:.|\n){0,220}?\brounded-(?:md|lg|xl)\b/;
const LEGACY_SHARED_SELECT_RADIUS_CLASS_PATTERN =
  /\.select-styled\s*\{[\s\S]*?rounded-(?:md|lg|xl)/;
const SHARED_SELECT_CLASS_PATTERN =
  /\.select-styled\s*\{[\s\S]*?border-radius:\s*0\.175rem;/;

const SOURCE_FILES = [
  "./calendar/CalendarActivityFormFields.svelte",
  "./calendar/CalendarCategoryModal.svelte",
  "./competition/CompetitionCreateAutoSquadSettings.svelte",
  "./competition/CompetitionResultsStatsSection.svelte",
  "./game/GameManageEventModal.svelte",
  "./playerTeamMemberships/BulkPlayerAssignmentTeamSelection.svelte",
] as const;

function read_component_source(relative_path: string): string {
  return readFileSync(new URL(relative_path, import.meta.url), "utf8");
}

function read_shared_style_source(): string {
  return readFileSync(
    new URL("../../../styles/app-base.css", import.meta.url),
    "utf8",
  );
}

describe("dropdown radius source contract", () => {
  it("uses the shared 0.175rem radius for the select utility", () => {
    const source = read_shared_style_source();

    expect(source).toContain(DROPDOWN_RADIUS_DECLARATION);
    expect(source).toMatch(SHARED_SELECT_CLASS_PATTERN);
    expect(source).not.toMatch(LEGACY_SHARED_SELECT_RADIUS_CLASS_PATTERN);
  });

  it("does not leave legacy rounded dropdown classes in inline select markup", () => {
    for (const source_file of SOURCE_FILES) {
      const source = read_component_source(source_file);

      expect(source).not.toMatch(LEGACY_INLINE_SELECT_RADIUS_CLASS_PATTERN);
    }
  });
});
