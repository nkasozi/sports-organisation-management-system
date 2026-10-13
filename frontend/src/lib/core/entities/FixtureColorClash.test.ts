import { describe, expect, it } from "vitest";

import {
  create_empty_jersey_assignment,
  detect_jersey_color_clashes,
  has_color_clashes,
  type JerseyAssignmentInput,
} from "./FixtureColorClash";

function jersey(
  main_color: string,
  jersey_color_id = "jersey_1",
): JerseyAssignmentInput {
  return { jersey_color_id, nickname: "Kit", main_color };
}

function clashes(
  home: string,
  away: string,
  officials: string,
): ReturnType<typeof detect_jersey_color_clashes> {
  return detect_jersey_color_clashes(
    jersey(home),
    jersey(away),
    jersey(officials),
    "Home",
    "Away",
  );
}

describe("detect_jersey_color_clashes", () => {
  it("creates an empty jersey assignment", () => {
    expect(create_empty_jersey_assignment()).toEqual({
      jersey_color_id: "",
      nickname: "",
      main_color: "",
    });
  });

  it("reports nearly identical colors for every clashing pair", () => {
    const warnings = clashes("#FF0000", "#ff0000", "ff0000");

    expect(warnings.map((w) => [w.party_a, w.party_b])).toEqual([
      ["Home", "Away"],
      ["Home", "Officials"],
      ["Away", "Officials"],
    ]);
    expect(warnings[0]).toEqual({
      party_a: "Home",
      party_b: "Away",
      color: "#FF0000",
      delta_e: 0,
      message:
        "Home and Away have nearly identical jersey colors (Delta E: 0.0)",
    });
  });

  it("expands three digit hex colors", () => {
    const warnings = clashes("#f00", "ff0000", "#0000ff");

    expect(warnings).toHaveLength(1);
    expect(warnings[0].delta_e).toBeCloseTo(0, 6);
  });

  it("describes very similar and similar colors", () => {
    const very_similar = clashes("#ff0000", "#f00a0a", "#0000ff")[0];
    const similar = clashes("#ff0000", "#e01a1a", "#0000ff")[0];

    expect(very_similar.message).toContain("very similar");
    expect(very_similar.delta_e).toBeGreaterThanOrEqual(5);
    expect(similar.message).toContain(" similar jersey colors");
    expect(similar.delta_e).toBeGreaterThanOrEqual(15);
    expect(similar.delta_e).toBeLessThan(25);
  });

  it("matches known CIELAB distances", () => {
    expect(clashes("#000000", "#111111", "#ffffff")[0].delta_e).toBeCloseTo(
      5.063305917,
      8,
    );
  });

  it("ignores distinct, invalid and unselected colors", () => {
    expect(clashes("#ffffff", "#000000", "#ff0000")).toEqual([]);
    expect(clashes("red", "red", "zzzzzz")).toEqual([]);
    expect(clashes("#12345", "#12345", "#1234")).toEqual([]);
    expect(
      detect_jersey_color_clashes(
        jersey("#ff0000", ""),
        jersey("#ff0000"),
        jersey(""),
        "Home",
        "Away",
      ),
    ).toEqual([]);
  });

  it("reports whether any clash exists", () => {
    expect(
      has_color_clashes(
        jersey("#ff0000"),
        jersey("#ff0000"),
        jersey("#0000ff"),
        "Home",
        "Away",
      ),
    ).toBe(true);
    expect(
      has_color_clashes(
        jersey("#ff0000"),
        jersey("#00ff00"),
        jersey("#0000ff"),
        "Home",
        "Away",
      ),
    ).toBe(false);
  });
});
