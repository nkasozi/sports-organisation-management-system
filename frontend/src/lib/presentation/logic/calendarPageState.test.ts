import { describe, expect, it } from "vitest";

import type { Activity } from "$lib/core/entities/Activity";
import type { ActivityCategory } from "$lib/core/entities/ActivityCategory";

import {
  build_activity_datetime_range,
  build_calendar_colors,
  build_manual_activity_input,
  create_activity_form_values_from_activity,
  get_current_year_date_range,
} from "./calendarPageState";

function create_test_activity(overrides: Partial<Activity>): Activity {
  return {
    id: overrides.id ?? "activity_1",
    created_at: overrides.created_at ?? "2024-01-01T00:00:00.000Z",
    updated_at: overrides.updated_at ?? "2024-01-01T00:00:00.000Z",
    title: overrides.title ?? "Training Session",
    description: overrides.description ?? "Warmup and drills",
    organization_id: overrides.organization_id ?? "organization_1",
    category_id: overrides.category_id ?? "category_1",
    category_type: overrides.category_type ?? "training",
    start_datetime: overrides.start_datetime ?? "2024-06-01T09:30:00",
    end_datetime: overrides.end_datetime ?? "2024-06-01T11:00:00",
    is_all_day: overrides.is_all_day ?? false,
    location: overrides.location ?? "Main Arena",
    venue_id: overrides.venue_id ?? null,
    team_ids: overrides.team_ids ?? [],
    competition_id: overrides.competition_id ?? null,
    fixture_id: overrides.fixture_id ?? null,
    source_type: overrides.source_type ?? "manual",
    source_id: overrides.source_id ?? null,
    status: overrides.status ?? "scheduled",
    recurrence: overrides.recurrence ?? null,
    reminders: overrides.reminders ?? [],
    color_override: overrides.color_override ?? null,
    notes: overrides.notes ?? "",
  };
}

function create_test_category(
  overrides: Partial<ActivityCategory>,
): ActivityCategory {
  return {
    id: overrides.id ?? "category_1",
    created_at: overrides.created_at ?? "2024-01-01T00:00:00.000Z",
    updated_at: overrides.updated_at ?? "2024-01-01T00:00:00.000Z",
    name: overrides.name ?? "Training",
    description: overrides.description ?? "",
    organization_id: overrides.organization_id ?? "organization_1",
    category_type: overrides.category_type ?? "training",
    color: overrides.color ?? "#3B82F6",
    icon: overrides.icon ?? "star",
    is_system_generated: overrides.is_system_generated ?? false,
  };
}

describe("calendar page date helpers", () => {
  it("builds the current year date range from a reference date", () => {
    expect(
      get_current_year_date_range(new Date("2025-05-10T00:00:00.000Z")),
    ).toEqual({
      start_date: "2025-01-01",
      end_date: "2025-12-31",
    });
  });

  it("builds all-day and timed activity datetime ranges", () => {
    expect(
      build_activity_datetime_range({
        title: "",
        description: "",
        category_id: "",
        start_date: "2024-06-01",
        start_time: "09:00",
        end_date: "2024-06-01",
        end_time: "11:00",
        is_all_day: false,
        location: "",
      }),
    ).toEqual({
      start_datetime: "2024-06-01T09:00:00",
      end_datetime: "2024-06-01T11:00:00",
    });
  });
});

describe("calendar page form helpers", () => {
  it("creates form values from an existing activity", () => {
    expect(
      create_activity_form_values_from_activity(create_test_activity({})),
    ).toMatchObject({
      title: "Training Session",
      start_date: "2024-06-01",
      start_time: "09:30",
      end_time: "11:00",
      location: "Main Arena",
    });
  });

  it("builds a manual activity input from form values and a category", () => {
    expect(
      build_manual_activity_input(
        create_activity_form_values_from_activity(create_test_activity({})),
        "organization_1",
        create_test_category({ category_type: "training" }),
      ),
    ).toMatchObject({
      organization_id: "organization_1",
      category_type: "training",
      source_type: "manual",
      title: "Training Session",
    });
  });
});

describe("calendar page color helpers", () => {
  it("maps category colors for schedule rendering", () => {
    expect(build_calendar_colors([create_test_category({})])).toEqual({
      training: {
        colorName: "Training",
        lightColors: {
          main: "#3B82F6",
          container: "#3B82F620",
          onContainer: "#3B82F6",
        },
        darkColors: {
          main: "#3B82F6",
          container: "#3B82F640",
          onContainer: "#FFFFFF",
        },
      },
    });
  });
});
