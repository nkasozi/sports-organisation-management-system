import { describe, expect, it } from "vitest";

import { generate_match_report_filename } from "./MatchReportBuilder";

describe("generate_match_report_filename", () => {
  it("produces a .pdf filename", () => {
    const name = generate_match_report_filename(
      "Harare City",
      "Dynamos FC",
      "2026-03-14",
    );
    expect(name).toMatch(/\.pdf$/);
  });

  it("replaces special characters in team names with underscores", () => {
    const name = generate_match_report_filename(
      "Team A & B",
      "Team C/D",
      "2026-03-14",
    );
    expect(name).not.toContain("&");
    expect(name).not.toContain("/");
    expect(name).not.toContain(" ");
  });

  it("replaces special characters in date with underscores", () => {
    const name = generate_match_report_filename(
      "HomeTeam",
      "AwayTeam",
      "2026-03-14",
    );
    expect(name).not.toContain("-");
  });

  it("includes both team names in the filename", () => {
    const name = generate_match_report_filename(
      "HarareCity",
      "DynamosFC",
      "20260314",
    );
    expect(name).toContain("HarareCity");
    expect(name).toContain("DynamosFC");
  });

  it("includes the date in the filename", () => {
    const name = generate_match_report_filename("TeamA", "TeamB", "20260314");
    expect(name).toContain("20260314");
  });

  it("includes 'Match_Report' prefix", () => {
    const name = generate_match_report_filename("A", "B", "2026");
    expect(name).toMatch(/^Match_Report_/);
  });
});
