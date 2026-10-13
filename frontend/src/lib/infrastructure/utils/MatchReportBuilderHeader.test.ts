import { describe, expect, it } from "vitest";

import { build_match_report_data } from "./MatchReportBuilder";
import {
  make_basic_context,
  make_competition,
  make_fixture,
} from "./MatchReportBuilder.test_support";

describe("build_match_report_data", () => {
  it("returns correct final score from fixture", () => {
    const ctx = make_basic_context({
      fixture: make_fixture({ home_team_score: 3, away_team_score: 0 }),
    });
    const report = build_match_report_data(ctx);
    expect(report.final_score.home).toBe(3);
    expect(report.final_score.away).toBe(0);
  });

  it("returns a zero final score for scoreless fixtures", () => {
    const ctx = make_basic_context({
      fixture: make_fixture({
        home_team_score: 0,
        away_team_score: 0,
      }),
    });
    const report = build_match_report_data(ctx);
    expect(report.final_score.home).toBe(0);
    expect(report.final_score.away).toBe(0);
  });

  it("sets competition name in uppercase", () => {
    const ctx = make_basic_context({
      competition: make_competition({ name: "Premier Cup" }),
    });
    const report = build_match_report_data(ctx);
    expect(report.competition_name).toBe("PREMIER CUP");
  });

  it("falls back to 'COMPETITION' when competition is missing", () => {
    const ctx = make_basic_context({ competition: void 0 as never });
    const report = build_match_report_data(ctx);
    expect(report.competition_name).toBe("COMPETITION");
  });

  it("uses organization_name as league_name", () => {
    const ctx = make_basic_context({
      organization_name: "Zimbabwe Hockey Union",
    });
    const report = build_match_report_data(ctx);
    expect(report.league_name).toBe("Zimbabwe Hockey Union");
  });

  it("defaults league_name when organization_name absent", () => {
    const ctx = make_basic_context();
    const report = build_match_report_data(ctx);
    expect(report.league_name).toBe("SPORT-SYNC");
  });

  it("populates home and away team names", () => {
    const ctx = make_basic_context();
    const report = build_match_report_data(ctx);
    expect(report.home_team.name).toBe("Harare City");
    expect(report.away_team.name).toBe("Dynamos FC");
  });

  it("derives team initials from team names", () => {
    const ctx = make_basic_context();
    const report = build_match_report_data(ctx);
    expect(report.home_team.initials).toBeTruthy();
    expect(report.away_team.initials).toBeTruthy();
  });

  it("uses fixture scheduled_time for push_back_time", () => {
    const ctx = make_basic_context({
      fixture: make_fixture({ scheduled_time: "15:30" }),
    });
    const report = build_match_report_data(ctx);
    expect(report.push_back_time).toBe("15:30");
    expect(report.scheduled_push_back).toBe("15:30");
  });

  it("defaults scheduled_time to 00:00 when absent", () => {
    const ctx = make_basic_context({
      fixture: make_fixture({ scheduled_time: void 0 as unknown as string }),
    });
    const report = build_match_report_data(ctx);
    expect(report.push_back_time).toBe("00:00");
  });

  it("uses venue_name prop when provided", () => {
    const ctx = make_basic_context({ venue_name: "National Sports Stadium" });
    const report = build_match_report_data(ctx);
    expect(report.venue_name).toBe("National Sports Stadium");
  });

  it("falls back to fixture.venue when venue_name prop absent", () => {
    const ctx = make_basic_context({
      fixture: make_fixture({ venue: "Old Hararians" }),
    });
    const report = build_match_report_data(ctx);
    expect(report.venue_name).toBe("Old Hararians");
  });

  it("falls back to 'Unknown Venue' when neither venue_name nor fixture.venue set", () => {
    const ctx = make_basic_context({ fixture: make_fixture({ venue: "" }) });
    const report = build_match_report_data(ctx);
    expect(report.venue_name).toBe("Unknown Venue");
  });

  it("populates fixture year from scheduled_date", () => {
    const ctx = make_basic_context({
      fixture: make_fixture({ scheduled_date: "2026-03-14" }),
    });
    const report = build_match_report_data(ctx);
    expect(report.fixture_year).toBe("2026");
  });

  it("populates game_week from fixture.match_day", () => {
    const ctx = make_basic_context({ fixture: make_fixture({ match_day: 7 }) });
    const report = build_match_report_data(ctx);
    expect(report.game_week).toBe(7);
  });

  it("populates pool from fixture.round_name", () => {
    const ctx = make_basic_context({
      fixture: make_fixture({ round_name: "Group B" }),
    });
    const report = build_match_report_data(ctx);
    expect(report.pool).toBe("Group B");
  });
});
