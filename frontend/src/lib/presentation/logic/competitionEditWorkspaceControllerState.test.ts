import { describe, expect, it } from "vitest";

import {
  create_competition_workspace_filters,
  create_competition_workspace_options,
  derive_competition_workspace_status,
} from "./competitionEditWorkspaceControllerState";

describe("competitionEditWorkspaceControllerState", () => {
  it("builds select options for organizations and competition formats", () => {
    expect(
      create_competition_workspace_options({
        organizations: [{ id: "organization-1", name: "Premier League" }],
        competition_formats: [{ id: "format-1", name: "League" }],
      } as never),
    ).toEqual({
      organization_options: [
        { value: "organization-1", label: "Premier League" },
      ],
      competition_format_options: [{ value: "format-1", label: "League" }],
    });
  });

  it("derives workspace status and filter payloads for competition sub-entities", () => {
    expect(
      derive_competition_workspace_status({
        form_data: {
          start_date: "2999-01-01",
          end_date: "2999-12-31",
        },
      } as never),
    ).toEqual({
      derived_status: "upcoming",
      status_display: {
        label: "Upcoming",
        color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      },
    });

    expect(create_competition_workspace_filters("competition-1")).toEqual({
      competition_stage_filter: {
        foreign_key_field: "competition_id",
        foreign_key_value: "competition-1",
      },
      official_jersey_filter: {
        foreign_key_field: "holder_id",
        foreign_key_value: "competition-1",
        holder_type_field: "holder_type",
        holder_type_value: "competition_official",
      },
    });
  });
});
