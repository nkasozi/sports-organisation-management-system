import { describe, expect, it } from "vitest";

import {
  type CreateOfficialAssociatedTeamInput,
  OFFICIAL_TEAM_ASSOCIATION_TYPE_OPTIONS,
  validate_official_associated_team_input,
} from "./OfficialAssociatedTeam";

function build_input(
  overrides: Partial<CreateOfficialAssociatedTeamInput> = {},
): CreateOfficialAssociatedTeamInput {
  return {
    official_id: "official_1",
    team_id: "team_1",
    association_type: "current_member",
    start_date: "2024-01-01",
    end_date: "2024-12-31",
    notes: "",
    status: "active",
    ...overrides,
  };
}

describe("validate_official_associated_team_input", () => {
  it("accepts a complete association", () => {
    expect(validate_official_associated_team_input(build_input())).toEqual([]);
  });

  it("requires official and team", () => {
    expect(
      validate_official_associated_team_input(
        build_input({ official_id: " ", team_id: "" }),
      ),
    ).toEqual(["Official is required", "Team is required"]);
  });

  it("rejects missing and unknown association types", () => {
    const missing = build_input({
      association_type:
        "" as CreateOfficialAssociatedTeamInput["association_type"],
    });
    const unknown = build_input({
      association_type:
        "rival" as CreateOfficialAssociatedTeamInput["association_type"],
    });
    expect(validate_official_associated_team_input(missing)).toEqual([
      "Association type is required",
      "Invalid association type",
    ]);
    expect(validate_official_associated_team_input(unknown)).toEqual([
      "Invalid association type",
    ]);
  });

  it("rejects an end date before the start date", () => {
    expect(
      validate_official_associated_team_input(
        build_input({ start_date: "2024-05-01", end_date: "2024-04-01" }),
      ),
    ).toEqual(["End date cannot be before start date"]);
  });
});

describe("OFFICIAL_TEAM_ASSOCIATION_TYPE_OPTIONS", () => {
  it("lists every association type with a label", () => {
    expect(OFFICIAL_TEAM_ASSOCIATION_TYPE_OPTIONS).toEqual([
      { value: "current_member", label: "Current Member" },
      { value: "former_member", label: "Former Member" },
      { value: "family_connection", label: "Family Connection" },
      { value: "financial_interest", label: "Financial Interest" },
      { value: "other", label: "Other" },
    ]);
  });
});
