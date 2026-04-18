import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  player_profile_management_configuration,
  team_profile_management_configuration,
} from "./profileManagementPageConfigurations";

const profile_management_use_case_mocks = vi.hoisted(() => ({
  get_player_profile_use_cases: vi.fn(),
  get_player_use_cases: vi.fn(),
  get_team_profile_use_cases: vi.fn(),
  get_team_use_cases: vi.fn(),
}));

vi.mock("$lib/infrastructure/registry/useCaseFactories", () => ({
  get_player_profile_use_cases:
    profile_management_use_case_mocks.get_player_profile_use_cases,
  get_player_use_cases: profile_management_use_case_mocks.get_player_use_cases,
  get_team_profile_use_cases:
    profile_management_use_case_mocks.get_team_profile_use_cases,
  get_team_use_cases: profile_management_use_case_mocks.get_team_use_cases,
}));

describe("profileManagementPageConfigurations", () => {
  beforeEach(() => {
    profile_management_use_case_mocks.get_player_profile_use_cases.mockReturnValue(
      { kind: "player-profiles" },
    );
    profile_management_use_case_mocks.get_player_use_cases.mockReturnValue({
      kind: "players",
    });
    profile_management_use_case_mocks.get_team_profile_use_cases.mockReturnValue(
      { kind: "team-profiles" },
    );
    profile_management_use_case_mocks.get_team_use_cases.mockReturnValue({
      kind: "teams",
    });
  });

  it("configures team profile management with team-specific preview and authorization data", () => {
    expect(team_profile_management_configuration.page_head_title).toBe(
      "Team Profiles - Sports Management",
    );
    expect(team_profile_management_configuration.subject_column_label).toBe(
      "Team",
    );
    expect(team_profile_management_configuration.show_edit_preview).toBe(false);
    expect(
      team_profile_management_configuration.authorization_filter_fields,
    ).toEqual(["team_id", "organization_id"]);
    expect(
      team_profile_management_configuration.get_related_entity_label({
        id: "team-1",
        name: "City Hawks",
      } as never),
    ).toBe("City Hawks");
    expect(
      team_profile_management_configuration.get_profile_related_entity_id({
        team_id: "team-1",
      } as never),
    ).toBe("team-1");
    expect(
      team_profile_management_configuration.get_profile_preview_path({
        profile_slug: "city-hawks",
      } as never),
    ).toBe("/team-profile/city-hawks");
  });

  it("configures player profile management with player labels and public preview paths", () => {
    expect(player_profile_management_configuration.page_head_title).toBe(
      "Player Profiles - Sports Management",
    );
    expect(player_profile_management_configuration.subject_column_label).toBe(
      "Player",
    );
    expect(player_profile_management_configuration.show_edit_preview).toBe(
      true,
    );
    expect(
      player_profile_management_configuration.get_related_entity_label({
        id: "player-1",
        first_name: "Jane",
        last_name: "Doe",
      } as never),
    ).toBe("Jane Doe");
    expect(
      player_profile_management_configuration.get_profile_related_entity_id({
        player_id: "player-1",
      } as never),
    ).toBe("player-1");
    expect(
      player_profile_management_configuration.get_profile_preview_path({
        profile_slug: "jane-doe",
      } as never),
    ).toBe("/profile/jane-doe");
  });
});
