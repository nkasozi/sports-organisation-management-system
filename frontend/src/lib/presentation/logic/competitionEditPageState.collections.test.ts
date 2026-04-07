import { describe, expect, it } from "vitest";

import type { Team } from "$lib/core/entities/Team";

import {
  create_competition_team_collections,
  create_competition_update_form_data,
  get_competition_team_collections_after_add,
  get_competition_team_collections_after_remove,
} from "./competitionEditPageState";
import {
  create_test_competition,
  create_test_competition_team,
  create_test_team,
} from "./competitionEditPageState.testData";

describe("create_competition_update_form_data", () => {
  it("copies editable fields from the loaded competition", () => {
    const competition = create_test_competition({
      allow_auto_squad_submission: true,
      rule_overrides: { custom_rules: { travel_window: "48h" } },
    });

    expect(create_competition_update_form_data(competition)).toEqual(
      expect.objectContaining({
        name: "Premier Cup",
        organization_id: "organization_1",
        competition_format_id: "format_1",
        allow_auto_squad_submission: true,
        rule_overrides: { custom_rules: { travel_window: "48h" } },
      }),
    );
  });
});

describe("competition team collections", () => {
  it("builds available teams from the full organization pool", () => {
    const registered_team = create_test_team({ id: "team_1" });
    const available_team = create_test_team({ id: "team_2", name: "Wolves" });
    const registered_team_from_previous_organization = create_test_team({
      id: "team_3",
      organization_id: "organization_2",
      name: "Tigers",
    });

    const collections = create_competition_team_collections(
      [
        registered_team,
        available_team,
        registered_team_from_previous_organization,
      ],
      [
        create_test_competition_team({ team_id: "team_1" }),
        create_test_competition_team({
          id: "competition_team_3",
          team_id: "team_3",
        }),
      ],
      "organization_1",
    );

    expect(
      collections.teams_in_competition.map((team: Team) => team.id),
    ).toEqual(["team_1", "team_3"]);
    expect(collections.available_teams.map((team: Team) => team.id)).toEqual([
      "team_2",
    ]);
  });

  it("adds a team to the competition collections", () => {
    const existing_team = create_test_team({ id: "team_1" });
    const added_team = create_test_team({ id: "team_2", name: "Wolves" });
    const starting_collections = create_competition_team_collections(
      [existing_team, added_team],
      [create_test_competition_team({ team_id: "team_1" })],
      "organization_1",
    );

    const next_collections = get_competition_team_collections_after_add(
      starting_collections,
      create_test_competition_team({
        id: "competition_team_2",
        team_id: "team_2",
      }),
      added_team,
    );

    expect(next_collections.available_teams).toEqual([]);
    expect(
      next_collections.teams_in_competition.map((team: Team) => team.id),
    ).toEqual(["team_1", "team_2"]);
  });

  it("removes a team from the competition collections", () => {
    const registered_team = create_test_team({ id: "team_1" });
    const collections = create_competition_team_collections(
      [registered_team],
      [create_test_competition_team({ team_id: "team_1" })],
      "organization_1",
    );

    const next_collections = get_competition_team_collections_after_remove(
      collections,
      registered_team,
    );

    expect(next_collections.competition_team_entries).toEqual([]);
    expect(next_collections.teams_in_competition).toEqual([]);
    expect(
      next_collections.available_teams.map((team: Team) => team.id),
    ).toEqual(["team_1"]);
  });
});
