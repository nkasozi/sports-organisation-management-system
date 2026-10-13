import { describe, expect, it } from "vitest";

import {
  generate_ical_feed,
  type ICalEvent,
  type ICalFeedConfig,
} from "./ICalService";

describe("ICalService", () => {
  describe("generate_ical_feed", () => {
    it("should generate valid iCal feed with proper headers", () => {
      const events = [] as ICalEvent[];
      const config = {
        feed_name: "Test Calendar",
        organization_name: "Test Organization",
        timezone: "UTC",
        reminder_minutes_before: 60,
      } as ICalFeedConfig;

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
      const events = [] as ICalEvent[];
      const config = {
        feed_name: "Test Calendar",
        organization_name: "Test Organization",
        timezone: "UTC",
        reminder_minutes_before: 60,
      } as ICalFeedConfig;

      const result = generate_ical_feed(events, config);

      expect(result).toContain("REFRESH-INTERVAL;VALUE=DURATION:PT1H");
      expect(result).toContain("X-PUBLISHED-TTL:PT1H");
    });

    it("should generate event blocks for each event", () => {
      const events = [
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
      ] as ICalEvent[];
      const config = {
        feed_name: "Test Calendar",
        organization_name: "Test Organization",
        timezone: "UTC",
        reminder_minutes_before: 60,
      } as ICalFeedConfig;

      const result = generate_ical_feed(events, config);

      expect(result).toContain("BEGIN:VEVENT");
      expect(result).toContain("UID:event-1@test");
      expect(result).toContain("SUMMARY:Test Match");
      expect(result).toContain("DESCRIPTION:A test match");
      expect(result).toContain("LOCATION:Test Stadium");
      expect(result).toContain("END:VEVENT");
    });

    it("should include VALARM for reminders", () => {
      const events = [
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
      ] as ICalEvent[];
      const config = {
        feed_name: "Test Calendar",
        organization_name: "Test Organization",
        timezone: "UTC",
        reminder_minutes_before: 60,
      } as ICalFeedConfig;

      const result = generate_ical_feed(events, config);

      expect(result).toContain("BEGIN:VALARM");
      expect(result).toContain("ACTION:DISPLAY");
      expect(result).toContain("TRIGGER:-PT30M");
      expect(result).toContain("END:VALARM");
    });

    it("should format all-day events correctly", () => {
      const events = [
        {
          uid: "event-1@test",
          title: "All Day Event",
          description: "",
          location: "",
          start_datetime: "2026-01-15T00:00:00.000Z",
          end_datetime: "2026-01-16T00:00:00.000Z",
          is_all_day: true,
          reminder_minutes_before: 0,
        },
      ] as ICalEvent[];
      const config = {
        feed_name: "Test Calendar",
        organization_name: "Test Organization",
        timezone: "UTC",
        reminder_minutes_before: 60,
      } as ICalFeedConfig;

      const result = generate_ical_feed(events, config);

      expect(result).toContain("DTSTART;VALUE=DATE:20260115");
      expect(result).toContain("DTEND;VALUE=DATE:20260116");
    });

    it("should escape special characters in text fields", () => {
      const events = [
        {
          uid: "event-1@test",
          title: "Match; Home vs Away, Important",
          description: "Line 1\nLine 2",
          location: "Stadium, City",
          start_datetime: "2026-01-15T14:00:00.000Z",
          end_datetime: "2026-01-15T16:00:00.000Z",
          is_all_day: false,
          reminder_minutes_before: 0,
        },
      ] as ICalEvent[];
      const config = {
        feed_name: "Test Calendar",
        organization_name: "Test Organization",
        timezone: "UTC",
        reminder_minutes_before: 60,
      } as ICalFeedConfig;

      const result = generate_ical_feed(events, config);

      expect(result).toContain("SUMMARY:Match\\; Home vs Away\\, Important");
      expect(result).toContain("DESCRIPTION:Line 1\\nLine 2");
      expect(result).toContain("LOCATION:Stadium\\, City");
    });

    it("should escape carriage returns so text cannot inject iCal properties", () => {
      const events = [
        {
          uid: "event-1@test",
          title: "Match\r\nATTENDEE:mailto:x@example.com",
          description: "Line 1\r\nLine 2\rLine 3",
          location: "",
          start_datetime: "2026-01-15T14:00:00.000Z",
          end_datetime: "2026-01-15T16:00:00.000Z",
          is_all_day: false,
          reminder_minutes_before: 0,
        },
      ] as ICalEvent[];
      const config = {
        feed_name: "Test Calendar",
        organization_name: "Test Organization",
        timezone: "UTC",
        reminder_minutes_before: 60,
      } as ICalFeedConfig;

      const result = generate_ical_feed(events, config);

      expect(result).toContain("SUMMARY:Match\\nATTENDEE:mailto:x@example.com");
      expect(result).toContain("DESCRIPTION:Line 1\\nLine 2\\nLine 3");
      expect(result).not.toContain("\r\nATTENDEE");
    });
  });
});
