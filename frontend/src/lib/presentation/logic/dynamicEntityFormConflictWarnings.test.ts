import { beforeEach, describe, expect, it, vi } from "vitest";

const { detect_jersey_color_clashes_mock } = vi.hoisted(() => ({
  detect_jersey_color_clashes_mock: vi.fn(),
}));

vi.mock("../../core/entities/Fixture", () => ({
  detect_jersey_color_clashes: detect_jersey_color_clashes_mock,
}));

import { build_dynamic_form_jersey_color_warnings } from "./dynamicEntityFormConflictWarnings";

describe("dynamicEntityFormConflictWarnings", () => {
  beforeEach(() => {
    detect_jersey_color_clashes_mock.mockReset();
  });

  it("returns no warnings for unrelated entity types", () => {
    expect(build_dynamic_form_jersey_color_warnings("fixture", {}, {})).toEqual(
      [],
    );
  });

  it("maps detected jersey clashes into warning messages for fixture detail setup forms", () => {
    detect_jersey_color_clashes_mock.mockReturnValueOnce([
      { message: "Home and away jerseys clash" },
      { message: "Official jersey clashes with home team" },
    ]);

    expect(
      build_dynamic_form_jersey_color_warnings(
        "FixtureDetailsSetup",
        {
          home_team_jersey_id: "jersey-1",
          away_team_jersey_id: "jersey-2",
          official_jersey_id: "jersey-3",
        },
        {
          home_team_jersey_id: [
            { id: "jersey-1", nickname: "Red", main_color: "#f00" },
          ],
          away_team_jersey_id: [
            { id: "jersey-2", nickname: "Blue", main_color: "#00f" },
          ],
          official_jersey_id: [
            { id: "jersey-3", nickname: "Black", main_color: "#000" },
          ],
        } as never,
      ),
    ).toEqual([
      "Home and away jerseys clash",
      "Official jersey clashes with home team",
    ]);
  });
});
