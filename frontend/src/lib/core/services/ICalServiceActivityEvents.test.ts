import { describe, expect, it } from "vitest";

import { type Activity, NO_ACTIVITY_RECURRENCE } from "../entities/Activity";
import { convert_activity_to_ical_event } from "./ICalService";

describe("ICalService", () => {
  describe("convert_activity_to_ical_event", () => {
    it("should convert activity to iCal event", () => {
      const activity = {
        id: "activity-123",
        title: "Team Practice",
        description: "Weekly practice session",
        organization_id: "org-1",
        category_id: "cat-1",
        category_type: "training",
        start_datetime: "2026-01-15T10:00:00.000Z",
        end_datetime: "2026-01-15T12:00:00.000Z",
        is_all_day: false,
        location: "Training Ground",
        venue_id: "",
        team_ids: ["team-1"],
        competition_id: "",
        fixture_id: "",
        source_type: "manual",
        source_id: "",
        status: "scheduled",
        recurrence: NO_ACTIVITY_RECURRENCE,
        reminders: [{ id: "rem-1", minutes_before: 30, is_enabled: true }],
        color_override: "",
        notes: "",
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      } as unknown as Activity;

      const result = convert_activity_to_ical_event(activity, "Test Org");

      expect(result.uid).toBe("activity-activity-123@test-org");
      expect(result.title).toBe("Team Practice");
      expect(result.description).toBe("Weekly practice session");
      expect(result.location).toBe("Training Ground");
      expect(result.is_all_day).toBe(false);
      expect(result.reminder_minutes_before).toBe(30);
    });

    it("should use first enabled reminder", () => {
      const activity = {
        id: "activity-123",
        title: "Event",
        description: "",
        organization_id: "org-1",
        category_id: "cat-1",
        category_type: "custom",
        start_datetime: "2026-01-15T10:00:00.000Z",
        end_datetime: "2026-01-15T12:00:00.000Z",
        is_all_day: false,
        location: "",
        venue_id: "",
        team_ids: [],
        competition_id: "",
        fixture_id: "",
        source_type: "manual",
        source_id: "",
        status: "scheduled",
        recurrence: NO_ACTIVITY_RECURRENCE,
        reminders: [
          { id: "rem-1", minutes_before: 60, is_enabled: false },
          { id: "rem-2", minutes_before: 15, is_enabled: true },
        ],
        color_override: "",
        notes: "",
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      } as unknown as Activity;

      const result = convert_activity_to_ical_event(activity, "Test Org");

      expect(result.reminder_minutes_before).toBe(15);
    });

    it("should return zero reminder minutes when no reminders are enabled", () => {
      const activity = {
        id: "activity-456",
        title: "Event",
        description: "",
        organization_id: "org-1",
        category_id: "cat-1",
        category_type: "custom",
        start_datetime: "2026-01-15T10:00:00.000Z",
        end_datetime: "2026-01-15T12:00:00.000Z",
        is_all_day: false,
        location: "",
        venue_id: "",
        team_ids: [],
        competition_id: "",
        fixture_id: "",
        source_type: "manual",
        source_id: "",
        status: "scheduled",
        recurrence: NO_ACTIVITY_RECURRENCE,
        reminders: [{ id: "rem-1", minutes_before: 60, is_enabled: false }],
        color_override: "",
        notes: "",
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      } as unknown as Activity;

      const result = convert_activity_to_ical_event(activity, "Test Org");

      expect(result.reminder_minutes_before).toBe(0);
    });
  });
});
