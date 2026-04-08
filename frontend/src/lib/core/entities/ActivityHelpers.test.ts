import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  can_delete_activity,
  can_edit_activity,
  create_activity_from_competition,
  create_activity_from_fixture,
  validate_activity_input,
} from "./ActivityHelpers";
import { ACTIVITY_SOURCE_TYPE } from "./StatusConstants";

describe("ActivityHelpers", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-08T10:00:00.000Z"));
  });

  it("validates required fields and chronological activity ranges", () => {
    expect(
      validate_activity_input({
        title: "",
        organization_id: "",
        category_id: "",
        start_datetime: "2026-04-10T12:00:00.000Z",
        end_datetime: "2026-04-09T12:00:00.000Z",
      } as never),
    ).toEqual({
      is_valid: false,
      errors: {
        title: "Activity title is required",
        organization_id: "Organization is required",
        category_id: "Category is required",
        end_datetime: "End date must be after start date",
      },
    });
  });

  it("builds activity inputs from fixtures and competitions", () => {
    expect(
      create_activity_from_fixture(
        "fixture_1",
        "Uganda vs Kenya",
        "2026-04-12T14:00:00.000Z",
        "competition_1",
        "team_home",
        "team_away",
        "org_1",
        "category_fixture",
        "Lugogo",
      ),
    ).toMatchObject({
      title: "Uganda vs Kenya",
      organization_id: "org_1",
      category_type: "fixture",
      source_type: "fixture",
      team_ids: ["team_home", "team_away"],
      location: "Lugogo",
    });

    expect(
      create_activity_from_competition(
        "competition_1",
        "Easter Cup",
        "2026-05-01",
        "2026-05-10",
        "org_1",
        "category_competition",
        "Kampala",
      ),
    ).toMatchObject({
      title: "Easter Cup",
      category_type: "competition",
      is_all_day: true,
      source_type: "competition",
      location: "Kampala",
    });
  });

  it("allows editing and deleting only for manual activities", () => {
    expect(
      can_edit_activity({ source_type: ACTIVITY_SOURCE_TYPE.MANUAL } as never),
    ).toBe(true);
    expect(
      can_delete_activity({
        source_type: ACTIVITY_SOURCE_TYPE.MANUAL,
      } as never),
    ).toBe(true);
    expect(can_edit_activity({ source_type: "fixture" } as never)).toBe(false);
    expect(can_delete_activity({ source_type: "fixture" } as never)).toBe(
      false,
    );
  });
});
