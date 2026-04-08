import { describe, expect, it } from "vitest";

import {
  create_test_competition,
  create_test_competition_team,
  create_test_team,
} from "./competitionEditPageState.testData";

describe("competitionEditPageState.testData", () => {
  it("creates a competition with stable defaults and targeted overrides", () => {
    expect(create_test_competition({})).toMatchObject({
      id: "competition_1",
      name: "Premier Cup",
      organization_id: "organization_1",
      max_teams: 8,
      entry_fee: 25,
      status: "active",
    });

    expect(
      create_test_competition({ name: "Championship", max_teams: 16 }),
    ).toMatchObject({
      id: "competition_1",
      name: "Championship",
      organization_id: "organization_1",
      max_teams: 16,
      entry_fee: 25,
    });
  });

  it("creates team and competition-team fixtures that preserve unspecified defaults", () => {
    expect(create_test_team({ name: "Elite Squad" })).toMatchObject({
      id: "team_1",
      name: "Elite Squad",
      organization_id: "organization_1",
      gender_id: "gender_1",
      status: "active",
    });

    expect(
      create_test_competition_team({
        competition_id: "competition_final",
        team_id: "team_pro",
      }),
    ).toMatchObject({
      id: "competition_team_1",
      competition_id: "competition_final",
      team_id: "team_pro",
      points: 0,
      status: "registered",
    });
  });
});
