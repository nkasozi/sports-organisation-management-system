import { describe, expect, it, vi } from "vitest";

vi.mock("./listDisplayValueLogic", () => ({
  get_display_value_for_entity_field: vi.fn(
    (entity: Record<string, unknown>, field_name: string) =>
      String(entity[field_name] ?? ""),
  ),
}));

import { build_csv_content, build_csv_filename } from "./listCsvExportLogic";

describe("listCsvExportLogic", () => {
  it("returns an empty string when no rows or columns are available", () => {
    expect(build_csv_content([], ["name"], null, {})).toBe("");
    expect(
      build_csv_content(
        [{ id: "team_1", name: "Uganda" } as never],
        [],
        null,
        {},
      ),
    ).toBe("");
  });

  it("builds escaped csv output with metadata display names", () => {
    expect(
      build_csv_content(
        [{ id: "team_1", name: 'Uganda "Cranes"', city: "Kampala" } as never],
        ["name", "city"],
        {
          fields: [
            { field_name: "name", display_name: "Team Name" },
            { field_name: "city", display_name: "Home City" },
          ],
        } as never,
        {},
      ),
    ).toBe('Team Name,Home City\n"Uganda ""Cranes""","Kampala"');
  });

  it("builds filenames from the entity type and export date", () => {
    expect(
      build_csv_filename("team", new Date("2026-04-08T12:00:00.000Z")),
    ).toBe("team_export_2026-04-08.csv");
  });
});
