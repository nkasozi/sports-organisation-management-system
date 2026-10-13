import { describe, expect, it } from "vitest";

import type { Fixture } from "../entities/Fixture";
import { convert_fixture_to_ical_event } from "./ICalService";

describe("ICalService", () => {
  describe("convert_fixture_to_ical_event", () => {
    it("should convert fixture to iCal event with proper title", () => {
      const fixture = {
        id: "fixture-123",
        organization_id: "org-1",
        competition_id: "comp-1",
        round_number: 1,
        round_name: "Round 1",
        home_team_id: "team-1",
        away_team_id: "team-2",
        venue: "Main Stadium",
        scheduled_date: "2026-01-20",
        scheduled_time: "15:00",
        home_team_score: 0,
        away_team_score: 0,
        assigned_officials: [],
        game_events: [],
        current_period: "pre_game",
        current_minute: 0,
        match_day: 1,
        notes: "Season opener",
        stage_id: "stage-1",
        status: "scheduled",
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      } as unknown as Fixture;

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
      const fixture = {
        id: "fixture-123",
        organization_id: "org-1",
        competition_id: "comp-1",
        round_number: 1,
        round_name: "Round 1",
        home_team_id: "team-1",
        away_team_id: "team-2",
        venue: "",
        scheduled_date: "2026-01-20",
        scheduled_time: "19:30",
        home_team_score: 0,
        away_team_score: 0,
        assigned_officials: [],
        game_events: [],
        current_period: "pre_game",
        current_minute: 0,
        match_day: 1,
        notes: "",
        stage_id: "stage-1",
        status: "scheduled",
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      } as unknown as Fixture;

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
