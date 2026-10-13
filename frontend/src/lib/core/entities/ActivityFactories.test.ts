import { describe, expect, it } from "vitest";

import {
  create_activity_from_competition,
  create_activity_from_fixture,
  DEFAULT_REMINDERS,
  NO_ACTIVITY_RECURRENCE,
} from "./Activity";

describe("Activity Entity", () => {
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
      expect(result.venue_id).toBe("");
      expect(result.title).toBe("Match Day");
      expect(result.category_type).toBe("fixture");
      expect(result.team_ids).toContain("team-1");
      expect(result.team_ids).toContain("team-2");
      expect(result.competition_id).toBe("comp-123");
      expect(result.recurrence).toEqual(NO_ACTIVITY_RECURRENCE);
      expect(result.color_override).toBe("");
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
      expect(result.fixture_id).toBe("");
      expect(result.venue_id).toBe("");
      expect(result.title).toBe("Premier League 2025");
      expect(result.category_type).toBe("competition");
      expect(result.recurrence).toEqual(NO_ACTIVITY_RECURRENCE);
      expect(result.color_override).toBe("");
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
