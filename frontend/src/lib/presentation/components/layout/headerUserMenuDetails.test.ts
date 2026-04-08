import { describe, expect, it } from "vitest";

import { build_header_user_menu_details } from "./headerUserMenuDetails";

describe("headerUserMenuDetails", () => {
  it("builds vertically aligned detail rows in a stable order", () => {
    expect(
      build_header_user_menu_details({
        current_profile_email: "admin@uganda-hockey.org",
        current_user_role_display: "Organization Administrator",
        current_profile_organization_name: "Uganda Hockey Association",
        current_profile_team_id: "team_uganda_cranes",
        current_profile_team_name: "Uganda Cranes",
      }),
    ).toEqual([
      {
        label: "Email",
        value: "admin@uganda-hockey.org",
      },
      {
        label: "Role",
        value: "Organization Administrator",
      },
      {
        label: "Org",
        value: "Uganda Hockey Association",
      },
      {
        label: "Team",
        value: "Uganda Cranes",
      },
    ]);
  });

  it("omits empty rows and formats wildcard team access clearly", () => {
    expect(
      build_header_user_menu_details({
        current_profile_email: "",
        current_user_role_display: "System Administrator",
        current_profile_organization_name: "",
        current_profile_team_id: "*",
        current_profile_team_name: "",
      }),
    ).toEqual([
      {
        label: "Role",
        value: "System Administrator",
      },
      {
        label: "Team",
        value: "All Teams",
      },
    ]);
  });

  it("falls back to the raw team id when a specific scope has no resolved team name", () => {
    expect(
      build_header_user_menu_details({
        current_profile_email: "manager@uganda-hockey.org",
        current_user_role_display: "Team Manager",
        current_profile_organization_name: "Uganda Hockey Association",
        current_profile_team_id: "team_uganda_cranes",
        current_profile_team_name: "",
      }),
    ).toEqual([
      {
        label: "Email",
        value: "manager@uganda-hockey.org",
      },
      {
        label: "Role",
        value: "Team Manager",
      },
      {
        label: "Org",
        value: "Uganda Hockey Association",
      },
      {
        label: "Team",
        value: "team_uganda_cranes",
      },
    ]);
  });
});
