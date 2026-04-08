import { describe, expect, it } from "vitest";

import { build_calendar_shell_load_command } from "./calendarPageShellControllerTypes";

describe("calendarPageShellControllerTypes", () => {
  it("converts scoped shell state into a load command with the selected organization id", () => {
    expect(
      build_calendar_shell_load_command({
        selected_organization_id: "organization-1",
        filter_category_id: "category-1",
        filter_competition_id: "competition-1",
        filter_team_id: "team-1",
        use_cases: { kind: "use-cases" },
      } as never),
    ).toEqual({
      organization_id: "organization-1",
      filter_category_id: "category-1",
      filter_competition_id: "competition-1",
      filter_team_id: "team-1",
      use_cases: { kind: "use-cases" },
    });
  });
});
