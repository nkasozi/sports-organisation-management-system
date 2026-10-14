import { describe, expect, it } from "vitest";

import { resolve_card_severity_rules } from "./liveGameSportCardRules";

describe("resolve_card_severity_rules", () => {
  it("combines the sport's cards with the competition's extra cards", () => {
    const rules = resolve_card_severity_rules(
      { card_types: [{ id: "green_card", severity: "suspension" }] } as never,
      {
        rule_overrides: {
          additional_card_types: [{ id: "blue_card", severity: "ejection" }],
        },
      } as never,
    );
    expect(rules.get("green_card")).toBe("suspension");
    expect(rules.get("blue_card")).toBe("ejection");
    expect(rules.has("red_card")).toBe(false);
  });
});
