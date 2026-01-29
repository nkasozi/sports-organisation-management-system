import { describe, expect, it } from "vitest";
import {
  validate_activity_input,
  can_edit_activity,
  can_delete_activity,
  create_activity_from_fixture,
  create_activity_from_competition,
  DEFAULT_REMINDERS,
  type Activity,
  type CreateActivityInput,
  type ActivitySourceType,
} from "./Activity";

describe("Activity Entity", () => {
  describe("validate_activity_input", () => {
    const create_valid_input = (
      overrides: Partial<CreateActivityInput> = {},
    ): CreateActivityInput => ({
      title: "Team Training",
      description: "Weekly training session",
      organization_id: "org-123",
      category_id: "cat-456",
      category_type: "training",
      start_datetime: "2025-01-15T10:00:00Z",
      end_datetime: "2025-01-15T12:00:00Z",
      is_all_day: false,
      location: "Main Field",
      venue_id: null,
      team_ids: ["team-1"],
      competition_id: null,
      fixture_id: null,
      source_type: "manual",
      source_id: null,
      status: "scheduled",
      recurrence: null,
      reminders: DEFAULT_REMINDERS,
      color_override: null,
      google_calendar_sync_enabled: false,
      notes: "",
      ...overrides,
    });

    it("returns valid for a complete valid input", () => {
      const input = create_valid_input();
      const result = validate_activity_input(input);

      expect(result.is_valid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it("returns error when title is empty", () => {
      const input = create_valid_input({ title: "" });
      const result = validate_activity_input(input);

      expect(result.is_valid).toBe(false);
      expect(result.errors.title).toBeDefined();
    });

    it("returns error when title is only whitespace", () => {
      const input = create_valid_input({ title: "   " });
      const result = validate_activity_input(input);

      expect(result.is_valid).toBe(false);
      expect(result.errors.title).toBeDefined();
    });

    it("returns error when organization_id is empty", () => {
      const input = create_valid_input({ organization_id: "" });
      const result = validate_activity_input(input);

      expect(result.is_valid).toBe(false);
      expect(result.errors.organization_id).toBeDefined();
    });

    it("returns error when category_id is empty", () => {
      const input = create_valid_input({ category_id: "" });
      const result = validate_activity_input(input);

      expect(result.is_valid).toBe(false);
      expect(result.errors.category_id).toBeDefined();
    });

    it("returns error when start_datetime is empty", () => {
      const input = create_valid_input({ start_datetime: "" });
      const result = validate_activity_input(input);

      expect(result.is_valid).toBe(false);
      expect(result.errors.start_datetime).toBeDefined();
    });

    it("returns error when end_datetime is empty", () => {
      const input = create_valid_input({ end_datetime: "" });
      const result = validate_activity_input(input);

      expect(result.is_valid).toBe(false);
      expect(result.errors.end_datetime).toBeDefined();
    });

    it("returns error when end is before start", () => {
      const input = create_valid_input({
        start_datetime: "2025-01-15T12:00:00Z",
        end_datetime: "2025-01-15T10:00:00Z",
      });
      const result = validate_activity_input(input);

      expect(result.is_valid).toBe(false);
      expect(result.errors.end_datetime).toBeDefined();
    });

    it("allows same start and end for all-day events", () => {
      const input = create_valid_input({
        start_datetime: "2025-01-15T00:00:00Z",
        end_datetime: "2025-01-15T00:00:00Z",
        is_all_day: true,
      });
      const result = validate_activity_input(input);

      expect(result.is_valid).toBe(true);
    });

    it("collects multiple errors", () => {
      const input = create_valid_input({
        title: "",
        organization_id: "",
        category_id: "",
      });
      const result = validate_activity_input(input);

      expect(result.is_valid).toBe(false);
      expect(Object.keys(result.errors).length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("can_edit_activity", () => {
    const create_activity = (source_type: ActivitySourceType): Activity => ({
      id: "activity-123",
      title: "Test Activity",
      description: "Test description",
      organization_id: "org-123",
      category_id: "cat-456",
      category_type: "training",
      start_datetime: "2025-01-15T10:00:00Z",
      end_datetime: "2025-01-15T12:00:00Z",
      is_all_day: false,
      location: "Main Field",
      venue_id: null,
      team_ids: [],
      competition_id: null,
      fixture_id: null,
      source_type,
      source_id: null,
      status: "scheduled",
      recurrence: null,
      reminders: [],
      color_override: null,
      google_calendar_event_id: null,
      google_calendar_sync_enabled: false,
      last_synced_at: null,
      notes: "",
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    });

    it("allows editing manual activities", () => {
      const activity = create_activity("manual");
      expect(can_edit_activity(activity)).toBe(true);
    });

    it("prevents editing competition-sourced activities", () => {
      const activity = create_activity("competition");
      expect(can_edit_activity(activity)).toBe(false);
    });

    it("prevents editing fixture-sourced activities", () => {
      const activity = create_activity("fixture");
      expect(can_edit_activity(activity)).toBe(false);
    });

    it("allows editing google_calendar-sourced activities", () => {
      const activity = create_activity("google_calendar");
      expect(can_edit_activity(activity)).toBe(true);
    });
  });

  describe("can_delete_activity", () => {
    const create_activity = (source_type: ActivitySourceType): Activity => ({
      id: "activity-123",
      title: "Test Activity",
      description: "Test description",
      organization_id: "org-123",
      category_id: "cat-456",
      category_type: "training",
      start_datetime: "2025-01-15T10:00:00Z",
      end_datetime: "2025-01-15T12:00:00Z",
      is_all_day: false,
      location: "Main Field",
      venue_id: null,
      team_ids: [],
      competition_id: null,
      fixture_id: null,
      source_type,
      source_id: null,
      status: "scheduled",
      recurrence: null,
      reminders: [],
      color_override: null,
      google_calendar_event_id: null,
      google_calendar_sync_enabled: false,
      last_synced_at: null,
      notes: "",
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    });

    it("allows deleting manual activities", () => {
      const activity = create_activity("manual");
      expect(can_delete_activity(activity)).toBe(true);
    });

    it("prevents deleting competition-sourced activities", () => {
      const activity = create_activity("competition");
      expect(can_delete_activity(activity)).toBe(false);
    });

    it("prevents deleting fixture-sourced activities", () => {
      const activity = create_activity("fixture");
      expect(can_delete_activity(activity)).toBe(false);
    });

    it("prevents deleting google_calendar-sourced activities", () => {
      const activity = create_activity("google_calendar");
      expect(can_delete_activity(activity)).toBe(false);
    });
  });

  describe("create_activity_from_fixture", () => {
    it("creates an activity with fixture source type", () => {
      const result = create_activity_from_fixture(
        "fixture-123",
        "Match Day",
        "2025-01-15T15:00:00Z",
        "comp-123",
        "team-1",
        "team-2",
        "org-123",
        "cat-456",
        "Stadium",
      );

      expect(result.source_type).toBe("fixture");
      expect(result.source_id).toBe("fixture-123");
      expect(result.fixture_id).toBe("fixture-123");
      expect(result.title).toBe("Match Day");
      expect(result.category_type).toBe("fixture");
      expect(result.team_ids).toContain("team-1");
      expect(result.team_ids).toContain("team-2");
      expect(result.competition_id).toBe("comp-123");
    });

    it("sets is_all_day to false by default", () => {
      const result = create_activity_from_fixture(
        "fixture-123",
        "Match Day",
        "2025-01-15T15:00:00Z",
        "comp-123",
        "team-1",
        "team-2",
        "org-123",
        "cat-456",
        "Stadium",
      );

      expect(result.is_all_day).toBe(false);
    });

    it("sets end time 2 hours after start time", () => {
      const start_time = "2025-01-15T15:00:00Z";
      const result = create_activity_from_fixture(
        "fixture-123",
        "Match Day",
        start_time,
        "comp-123",
        "team-1",
        "team-2",
        "org-123",
        "cat-456",
        "Stadium",
      );

      const start = new Date(result.start_datetime);
      const end = new Date(result.end_datetime);
      const duration_hours =
        (end.getTime() - start.getTime()) / (1000 * 60 * 60);

      expect(duration_hours).toBe(2);
    });
  });

  describe("create_activity_from_competition", () => {
    it("creates an activity with competition source type", () => {
      const result = create_activity_from_competition(
        "comp-123",
        "Premier League 2025",
        "2025-01-01",
        "2025-12-31",
        "org-123",
        "cat-456",
        "Various",
      );

      expect(result.source_type).toBe("competition");
      expect(result.source_id).toBe("comp-123");
      expect(result.competition_id).toBe("comp-123");
      expect(result.title).toBe("Premier League 2025");
      expect(result.category_type).toBe("competition");
    });

    it("sets is_all_day to true for competition activities", () => {
      const result = create_activity_from_competition(
        "comp-123",
        "Premier League 2025",
        "2025-01-01",
        "2025-12-31",
        "org-123",
        "cat-456",
        "Various",
      );

      expect(result.is_all_day).toBe(true);
    });

    it("uses provided dates as datetime values", () => {
      const result = create_activity_from_competition(
        "comp-123",
        "Premier League 2025",
        "2025-01-01",
        "2025-12-31",
        "org-123",
        "cat-456",
        "Various",
      );

      expect(result.start_datetime).toBe("2025-01-01");
      expect(result.end_datetime).toBe("2025-12-31");
    });
  });

  describe("DEFAULT_REMINDERS", () => {
    it("includes a 1-day reminder enabled by default", () => {
      const one_day_reminder = DEFAULT_REMINDERS.find(
        (r) => r.minutes_before === 1440,
      );

      expect(one_day_reminder).toBeDefined();
      expect(one_day_reminder?.is_enabled).toBe(true);
    });

    it("includes a 1-hour reminder disabled by default", () => {
      const one_hour_reminder = DEFAULT_REMINDERS.find(
        (r) => r.minutes_before === 60,
      );

      expect(one_hour_reminder).toBeDefined();
      expect(one_hour_reminder?.is_enabled).toBe(false);
    });

    it("includes a 30-minute reminder disabled by default", () => {
      const thirty_min_reminder = DEFAULT_REMINDERS.find(
        (r) => r.minutes_before === 30,
      );

      expect(thirty_min_reminder).toBeDefined();
      expect(thirty_min_reminder?.is_enabled).toBe(false);
    });
  });
});
