import { get } from "svelte/store";
import {
  beforeEach,
  describe,
  expect,
  it,
  type MockedFunction,
  vi,
} from "vitest";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import { get_use_cases_for_entity_type } from "../../infrastructure/registry/entityUseCasesRegistry";
import { get_competition_team_use_cases } from "../../infrastructure/registry/useCaseFactories";
import { fetch_teams_excluding_player_memberships } from "./dynamicFormDataLoader";
import { create_base_entity } from "./dynamicFormDataLoader.test_support";

vi.mock("svelte/store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("svelte/store")>();
  return { ...actual, get: vi.fn() };
});
vi.mock("../stores/auth", () => ({
  auth_store: {},
}));
vi.mock("../../infrastructure/registry/entityUseCasesRegistry");
vi.mock("../../infrastructure/registry/useCaseFactories");

const mock_get_use_cases = get_use_cases_for_entity_type as MockedFunction<
  typeof get_use_cases_for_entity_type
>;
const mock_get_competition_team_use_cases =
  get_competition_team_use_cases as MockedFunction<
    typeof get_competition_team_use_cases
  >;
const mock_get = get as MockedFunction<typeof get>;

beforeEach(() => {
  vi.clearAllMocks();
  mock_get.mockReturnValue({ current_profile: { id: "user-123" } } as never);
});

describe("fetch_teams_excluding_player_memberships", () => {
  it("excludes teams the player is already a member of", async () => {
    const membership = create_base_entity("mem_1", { team_id: "team_a" });
    const team_a = create_base_entity("team_a");
    const team_b = create_base_entity("team_b");

    let call_index = 0;
    mock_get_use_cases.mockImplementation(() => ({
      success: true as const,
      data: {
        list: vi.fn().mockResolvedValue({
          success: true,
          data: { items: call_index++ === 0 ? [membership] : [team_a, team_b] },
        }),
      } as never,
    }));

    const result = await fetch_teams_excluding_player_memberships(
      "player_1",
      [],
      "",
    );

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("team_b");
  });

  it("filters by organization_id when provided", async () => {
    const team_in_org = create_base_entity("team_in_org", {
      organization_id: "org_1",
    });
    const team_other_org = create_base_entity("team_other", {
      organization_id: "org_2",
    });

    let call_index = 0;
    mock_get_use_cases.mockImplementation(() => ({
      success: true as const,
      data: {
        list: vi.fn().mockResolvedValue({
          success: true,
          data: {
            items: call_index++ === 0 ? [] : [team_in_org, team_other_org],
          },
        }),
      } as never,
    }));

    const result = await fetch_teams_excluding_player_memberships(
      "player_1",
      [],
      "org_1",
    );

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("team_in_org");
  });

  it("filters by gender when player has a gender and team has a gender", async () => {
    const player = create_base_entity("player_1", { gender_id: "gender_male" });
    const team_male = create_base_entity("team_a", {
      gender_id: "gender_male",
    });
    const team_female = create_base_entity("team_b", {
      gender_id: "gender_female",
    });
    const cached_players = [player as BaseEntity];

    let call_index = 0;
    mock_get_use_cases.mockImplementation(() => ({
      success: true as const,
      data: {
        list: vi.fn().mockResolvedValue({
          success: true,
          data: { items: call_index++ === 0 ? [] : [team_male, team_female] },
        }),
      } as never,
    }));

    const result = await fetch_teams_excluding_player_memberships(
      "player_1",
      cached_players,
      "",
    );

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("team_a");
  });
});
