import { describe, expect, it } from "vitest";

import {
  build_shareable_competition_results_url,
  derive_effective_points_config,
  derive_effective_tie_breakers,
  extract_competition_results_url_params,
} from "./competitionResultsPageData";
import {
  create_test_competition,
  create_test_competition_format,
} from "./competitionResultsPageData.test_support";

describe("competition results url helpers", () => {
  it("builds a shareable competition results url", () => {
    expect(
      build_shareable_competition_results_url(
        "https://example.com",
        "organization_1",
        "competition_1",
      ),
    ).toBe(
      "https://example.com/competition-results?org=organization_1&competition=competition_1",
    );
  });

  it("extracts organization and competition params from a url", () => {
    expect(
      extract_competition_results_url_params(
        new URL(
          "https://example.com/competition-results?org=organization_1&competition=competition_1",
        ),
      ),
    ).toEqual({
      org_id: "organization_1",
      competition_id: "competition_1",
    });
  });
});

describe("competition results rules helpers", () => {
  it("applies competition point overrides over the format defaults", () => {
    const competition_format = create_test_competition_format({});
    const competition = create_test_competition({
      rule_overrides: { points_config_override: { points_for_win: 5 } },
    });

    expect(
      derive_effective_points_config(
        {
          status: "present",
          competition_format,
        },
        {
          status: "present",
          competition,
        },
      ),
    ).toEqual({
      points_for_win: 5,
      points_for_draw: 1,
      points_for_loss: 0,
    });
  });

  it("prefers competition tie breaker overrides when available", () => {
    expect(
      derive_effective_tie_breakers(
        {
          status: "present",
          competition_format: create_test_competition_format({
            tie_breakers: ["goal_difference"],
          }),
        },
        {
          status: "present",
          competition: create_test_competition({
            rule_overrides: { tie_breakers_override: ["head_to_head"] },
          }),
        },
      ),
    ).toEqual(["head_to_head"]);
  });
});
