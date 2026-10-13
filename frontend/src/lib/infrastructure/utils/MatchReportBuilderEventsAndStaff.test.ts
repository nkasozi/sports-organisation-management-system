import { describe, expect, it } from "vitest";

import { build_match_report_data } from "./MatchReportBuilder";
import {
  make_basic_context,
  make_fixture,
  make_game_event,
} from "./MatchReportBuilder.test_support";

describe("build_match_report_data", () => {
  it("goal events increment home score correctly", () => {
    const fixture = make_fixture({
      game_events: [
        make_game_event({
          id: "e1",
          event_type: "goal",
          team_side: "home",
          minute: 20,
        }),
        make_game_event({
          id: "e2",
          event_type: "goal",
          team_side: "home",
          minute: 40,
        }),
      ],
    });
    const ctx = make_basic_context({ fixture });
    const report = build_match_report_data(ctx);
    const first_half = report.score_by_period.find(
      (p) => p.period_name === "First Half",
    );
    expect(first_half?.home_score).toBe(2);
  });

  it("own_goal event credits home team even if team_side is away", () => {
    const fixture = make_fixture({
      game_events: [
        make_game_event({
          id: "e1",
          event_type: "own_goal",
          team_side: "away",
          minute: 30,
        }),
      ],
    });
    const ctx = make_basic_context({ fixture });
    const report = build_match_report_data(ctx);
    const first_half = report.score_by_period.find(
      (p) => p.period_name === "First Half",
    );
    expect(first_half?.home_score).toBe(1);
    expect(first_half?.away_score).toBe(0);
  });

  it("home_staff and away_staff propagated to team info", () => {
    const ctx = make_basic_context({
      home_staff: [{ role: "Coach", name: "Bob" }],
      away_staff: [{ role: "Manager", name: "Alice" }],
    });
    const report = build_match_report_data(ctx);
    expect(report.home_team.staff).toEqual([{ role: "Coach", name: "Bob" }]);
    expect(report.away_team.staff).toEqual([
      { role: "Manager", name: "Alice" },
    ]);
  });

  it("defaults staff to empty arrays when not provided", () => {
    const ctx = make_basic_context();
    const report = build_match_report_data(ctx);
    expect(report.home_team.staff).toEqual([]);
    expect(report.away_team.staff).toEqual([]);
  });

  it("organization_logo_url defaults to empty string", () => {
    const ctx = make_basic_context();
    const report = build_match_report_data(ctx);
    expect(report.organization_logo_url).toBe("");
  });

  it("organization_logo_url uses provided value", () => {
    const ctx = make_basic_context({
      organization_logo_url: "https://example.com/logo.png",
    });
    const report = build_match_report_data(ctx);
    expect(report.organization_logo_url).toBe("https://example.com/logo.png");
  });
});
