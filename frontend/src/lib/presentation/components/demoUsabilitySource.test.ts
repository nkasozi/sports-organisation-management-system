import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

function read_component_source(relative_path: string): string {
  return readFileSync(new URL(relative_path, import.meta.url), "utf8");
}

describe("demo usability source contracts", () => {
  it("shows a save error once, beside the save button, not also in the top banner", () => {
    const top_banners = read_component_source(
      "./dynamicForm/DynamicFormTopBanners.svelte",
    );
    const warning_panels = read_component_source(
      "./dynamicForm/DynamicFormWarningPanels.svelte",
    );
    expect(top_banners).not.toContain("save_error_message");
    expect(warning_panels).toContain("message={save_error_message}");
  });

  it("lets standings team names use the full width on wider screens", () => {
    const row = read_component_source(
      "./competition/CompetitionStandingsRow.svelte",
    );
    const table = read_component_source(
      "./competition/CompetitionStandingsTable.svelte",
    );
    expect(row).toMatch(/truncate max-w-\[120px\] md:max-w-none/);
    expect(row).toContain("md:whitespace-normal");
    expect(table).toContain("md:min-w-[240px]");
    expect(table).toContain("overflow-x-auto");
  });

  it("explains that -1 means unlimited on both substitution limits", () => {
    const source = read_component_source(
      "./sport/SportSubstitutionsSection.svelte",
    );
    expect(
      source.match(/hint=\{build_substitution_limit_hint\(/g),
    ).toHaveLength(2);
  });

  it("does not let players already on a team be ticked in bulk assign", () => {
    const source = read_component_source(
      "./playerTeamMemberships/BulkPlayerAssignmentRow.svelte",
    );
    expect(source).toContain("disabled={!is_selectable}");
  });

  it("says plainly that no options were found for a filtered dropdown", () => {
    const source = read_component_source(
      "./dynamicForm/DynamicFormForeignKeyField.svelte",
    );
    expect(source).not.toMatch(/recently completed/i);
  });
});
