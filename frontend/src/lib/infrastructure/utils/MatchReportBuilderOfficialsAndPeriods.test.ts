import { describe, expect, it } from "vitest";

import { create_default_football_periods } from "$lib/core/entities/SportDefaults";

import { build_match_report_data } from "./MatchReportBuilder";
import {
  make_basic_context,
  make_fixture,
  make_game_event,
  make_official,
} from "./MatchReportBuilder.test_support";

describe("build_match_report_data", () => {
  it("maps assigned officials to name/role pairs", () => {
    const ctx = make_basic_context({
      assigned_officials: [
        { official: make_official("John", "Doe"), role_name: "referee" },
        {
          official: make_official("Jane", "Smith"),
          role_name: "assistant_referee",
        },
      ],
    });
    const report = build_match_report_data(ctx);
    expect(report.officials).toHaveLength(2);
    expect(report.officials[0].role).toBe("Referee");
    expect(report.officials[0].name).toContain("Doe");
    expect(report.officials[1].role).toBe("Assistant Referee");
  });

  it("maps unknown official roles using the raw string", () => {
    const ctx = make_basic_context({
      assigned_officials: [
        {
          official: make_official("A", "B"),
          role_name: "video_review_officer",
        },
      ],
    });
    const report = build_match_report_data(ctx);
    expect(report.officials[0].role).toBe("video_review_officer");
  });

  it("includes fixture notes as remarks", () => {
    const ctx = make_basic_context({
      fixture: make_fixture({ notes: "Match postponed once" }),
    });
    const report = build_match_report_data(ctx);
    expect(report.remarks).toBe("Match postponed once");
  });

  it("uses DEFAULT_CARD_TYPES when card_types not provided", () => {
    const ctx = make_basic_context();
    const report = build_match_report_data(ctx);
    expect(report.card_types.length).toBeGreaterThan(0);
    const types = report.card_types.map((c) => c.event_type);
    expect(types).toContain("yellow_card");
    expect(types).toContain("red_card");
  });

  it("uses custom card_types when provided", () => {
    const custom_cards = [
      {
        id: "custom",
        name: "Custom",
        color: "#000",
        event_type: "custom_card",
      },
    ];
    const ctx = make_basic_context({ card_types: custom_cards });
    const report = build_match_report_data(ctx);
    expect(report.card_types).toEqual(custom_cards);
  });

  it("score_by_period treats a sport without periods as one generic match period", () => {
    const ctx = make_basic_context();
    const report = build_match_report_data(ctx);
    expect(report.score_by_period.map((p) => p.period_name)).toEqual([]);
  });

  it("score_by_period follows the periods the sport defines", () => {
    const ctx = make_basic_context({
      periods: [
        {
          id: "q1",
          name: "1st Quarter",
          duration_minutes: 15,
          is_break: false,
        },
        {
          id: "q2",
          name: "2nd Quarter",
          duration_minutes: 15,
          is_break: false,
        },
        {
          id: "q3",
          name: "3rd Quarter",
          duration_minutes: 15,
          is_break: false,
        },
      ],
    });
    const report = build_match_report_data(ctx);
    expect(report.score_by_period.map((p) => p.period_name)).toEqual([
      "2nd Quarter",
      "1st Quarter",
    ]);
  });

  it("score_by_period adds the end of regulation and an extra time row when extra time goals exist", () => {
    const fixture = make_fixture({
      game_events: [
        make_game_event({
          id: "e1",
          event_type: "goal",
          team_side: "home",
          minute: 100,
        }),
      ],
    });
    const ctx = make_basic_context({
      fixture,
      periods: create_default_football_periods(),
    });
    const report = build_match_report_data(ctx);
    const period_names = report.score_by_period.map((p) => p.period_name);
    expect(period_names).toEqual(["Extra Time", "Second Half", "First Half"]);
    expect(report.score_by_period[0]).toMatchObject({
      home_score: 1,
      away_score: 0,
    });
  });
});
