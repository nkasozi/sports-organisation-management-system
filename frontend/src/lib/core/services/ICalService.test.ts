import { describe, it, expect } from "vitest";
import {
  generate_ical_feed,
  convert_activity_to_ical_event,
  convert_fixture_to_ical_event,
  type ICalEvent,
  type ICalFeedConfig,
} from "./ICalService";
import type { Activity } from "../entities/Activity";
import type { Fixture } from "../entities/Fixture";

describe("ICalService", () => {
  describe("generate_ical_feed", () => {
    it("should generate valid iCal feed with proper headers", () => {
      const events: ICalEvent[] = [];
      const config: ICalFeedConfig = {
        feed_name: "Test Calendar",
        organization_name: "Test Organization",
        timezone: "UTC",
        reminder_minutes_before: 60,
      };

      const result = generate_ical_feed(events, config);

      expect(result).toContain("BEGIN:VCALENDAR");
      expect(result).toContain("VERSION:2.0");
      expect(result).toContain(
        "PRODID:-//Test Organization//Sports Calendar//EN",
      );
      expect(result).toContain("X-WR-CALNAME:Test Calendar");
      expect(result).toContain("X-WR-TIMEZONE:UTC");
      expect(result).toContain("END:VCALENDAR");
    });

    it("should include refresh interval headers", () => {
      const events: ICalEvent[] = [];
      const config: ICalFeedConfig = {
        feed_name: "Test Calendar",
        organization_name: "Test Organization",
        timezone: "UTC",
        reminder_minutes_before: 60,
      };

      const result = generate_ical_feed(events, config);

      expect(result).toContain("REFRESH-INTERVAL;VALUE=DURATION:PT1H");
      expect(result).toContain("X-PUBLISHED-TTL:PT1H");
    });

    it("should generate event blocks for each event", () => {
      const events: ICalEvent[] = [
        {
          uid: "event-1@test",
          title: "Test Match",
          description: "A test match",
          location: "Test Stadium",
          start_datetime: "2026-01-15T14:00:00.000Z",
          end_datetime: "2026-01-15T16:00:00.000Z",
          is_all_day: false,
          reminder_minutes_before: 60,
        },
      ];
      const config: ICalFeedConfig = {
        feed_name: "Test Calendar",
        organization_name: "Test Organization",
        timezone: "UTC",
        reminder_minutes_before: 60,
      };

      const result = generate_ical_feed(events, config);

      expect(result).toContain("BEGIN:VEVENT");
      expect(result).toContain("UID:event-1@test");
      expect(result).toContain("SUMMARY:Test Match");
      expect(result).toContain("DESCRIPTION:A test match");
      expect(result).toContain("LOCATION:Test Stadium");
      expect(result).toContain("END:VEVENT");
    });

    it("should include VALARM for reminders", () => {
      const events: ICalEvent[] = [
        {
          uid: "event-1@test",
          title: "Test Match",
          description: "",
          location: "",
          start_datetime: "2026-01-15T14:00:00.000Z",
          end_datetime: "2026-01-15T16:00:00.000Z",
          is_all_day: false,
          reminder_minutes_before: 30,
        },
      ];
      const config: ICalFeedConfig = {
        feed_name: "Test Calendar",
        organization_name: "Test Organization",
        timezone: "UTC",
        reminder_minutes_before: 60,
      };

      const result = generate_ical_feed(events, config);

      expect(result).toContain("BEGIN:VALARM");
      expect(result).toContain("ACTION:DISPLAY");
      expect(result).toContain("TRIGGER:-PT30M");
      expect(result).toContain("END:VALARM");
    });

    it("should format all-day events correctly", () => {
      const events: ICalEvent[] = [
        {
          uid: "event-1@test",
          title: "All Day Event",
          description: "",
          location: "",
          start_datetime: "2026-01-15T00:00:00.000Z",
          end_datetime: "2026-01-16T00:00:00.000Z",
          is_all_day: true,
          reminder_minutes_before: null,
        },
      ];
      const config: ICalFeedConfig = {
        feed_name: "Test Calendar",
        organization_name: "Test Organization",
        timezone: "UTC",
        reminder_minutes_before: 60,
      };

      const result = generate_ical_feed(events, config);

      expect(result).toContain("DTSTART;VALUE=DATE:20260115");
      expect(result).toContain("DTEND;VALUE=DATE:20260116");
    });

    it("should escape special characters in text fields", () => {
      const events: ICalEvent[] = [
        {
          uid: "event-1@test",
          title: "Match; Home vs Away, Important",
          description: "Line 1\nLine 2",
          location: "Stadium, City",
          start_datetime: "2026-01-15T14:00:00.000Z",
          end_datetime: "2026-01-15T16:00:00.000Z",
          is_all_day: false,
          reminder_minutes_before: null,
        },
      ];
      const config: ICalFeedConfig = {
        feed_name: "Test Calendar",
        organization_name: "Test Organization",
        timezone: "UTC",
        reminder_minutes_before: 60,
      };

      const result = generate_ical_feed(events, config);

      expect(result).toContain("SUMMARY:Match\\; Home vs Away\\, Important");
      expect(result).toContain("DESCRIPTION:Line 1\\nLine 2");
      expect(result).toContain("LOCATION:Stadium\\, City");
    });
  });

  describe("convert_activity_to_ical_event", () => {
    it("should convert activity to iCal event", () => {
      const activity: Activity = {
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
        venue_id: null,
        team_ids: ["team-1"],
        competition_id: null,
        fixture_id: null,
        source_type: "manual",
        source_id: null,
        status: "scheduled",
        recurrence: null,
        reminders: [{ id: "rem-1", minutes_before: 30, is_enabled: true }],
        color_override: null,
        google_calendar_event_id: null,
        google_calendar_sync_enabled: false,
        last_synced_at: null,
        notes: "",
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      };

      const result = convert_activity_to_ical_event(activity, "Test Org");

      expect(result.uid).toBe("activity-activity-123@test-org");
      expect(result.title).toBe("Team Practice");
      expect(result.description).toBe("Weekly practice session");
      expect(result.location).toBe("Training Ground");
      expect(result.is_all_day).toBe(false);
      expect(result.reminder_minutes_before).toBe(30);
    });

    it("should use first enabled reminder", () => {
      const activity: Activity = {
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
        venue_id: null,
        team_ids: [],
        competition_id: null,
        fixture_id: null,
        source_type: "manual",
        source_id: null,
        status: "scheduled",
        recurrence: null,
        reminders: [
          { id: "rem-1", minutes_before: 60, is_enabled: false },
          { id: "rem-2", minutes_before: 15, is_enabled: true },
        ],
        color_override: null,
        google_calendar_event_id: null,
        google_calendar_sync_enabled: false,
        last_synced_at: null,
        notes: "",
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      };

      const result = convert_activity_to_ical_event(activity, "Test Org");

      expect(result.reminder_minutes_before).toBe(15);
    });
  });

  describe("convert_fixture_to_ical_event", () => {
    it("should convert fixture to iCal event with proper title", () => {
      const fixture: Fixture = {
        id: "fixture-123",
        competition_id: "comp-1",
        round_number: 1,
        round_name: "Round 1",
        home_team_id: "team-1",
        away_team_id: "team-2",
        venue: "Main Stadium",
        scheduled_date: "2026-01-20",
        scheduled_time: "15:00",
        home_team_score: null,
        away_team_score: null,
        assigned_officials: [],
        game_events: [],
        current_period: "pre_game",
        current_minute: 0,
        match_day: 1,
        notes: "Season opener",
        status: "scheduled",
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      };

      const result = convert_fixture_to_ical_event(
        fixture,
        "Home Team FC",
        "Away United",
        "Premier League",
        "Sports Org",
        60,
      );

      expect(result.uid).toBe("fixture-fixture-123@sports-org");
      expect(result.title).toBe("Home Team FC vs Away United");
      expect(result.location).toBe("Main Stadium");
      expect(result.description).toContain("Competition: Premier League");
      expect(result.description).toContain("Round: Round 1");
      expect(result.description).toContain("Venue: Main Stadium");
      expect(result.description).toContain("Notes: Season opener");
      expect(result.reminder_minutes_before).toBe(60);
    });

    it("should calculate end time as 2 hours after start", () => {
      const fixture: Fixture = {
        id: "fixture-123",
        competition_id: "comp-1",
        round_number: 1,
        round_name: "Round 1",
        home_team_id: "team-1",
        away_team_id: "team-2",
        venue: "",
        scheduled_date: "2026-01-20",
        scheduled_time: "19:30",
        home_team_score: null,
        away_team_score: null,
        assigned_officials: [],
        game_events: [],
        current_period: "pre_game",
        current_minute: 0,
        match_day: 1,
        notes: "",
        status: "scheduled",
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      };

      const result = convert_fixture_to_ical_event(
        fixture,
        "Team A",
        "Team B",
        "Cup",
        "Org",
        30,
      );

      const start = new Date(result.start_datetime);
      const end = new Date(result.end_datetime);
      const duration_hours =
        (end.getTime() - start.getTime()) / (1000 * 60 * 60);

      expect(duration_hours).toBe(2);
    });
  });
});
