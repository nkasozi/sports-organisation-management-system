import { get } from "svelte/store";
import {
  beforeEach,
  describe,
  expect,
  it,
  type MockedFunction,
  vi,
} from "vitest";

import { get_use_cases_for_entity_type } from "../../infrastructure/registry/entityUseCasesRegistry";
import { get_competition_team_use_cases } from "../../infrastructure/registry/useCaseFactories";
import { fetch_teams_from_player_memberships } from "./dynamicFormDataLoader";
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

describe("fetch_teams_from_player_memberships", () => {
  it("returns teams the player is a member of", async () => {
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

    const result = await fetch_teams_from_player_memberships("player_1", "");

    expect(result.teams).toHaveLength(1);
    expect(result.teams[0].id).toBe("team_a");
  });

  it("sets auto_select_team_id when only one team and no current value", async () => {
    const membership = create_base_entity("mem_1", { team_id: "team_a" });
    const team_a = create_base_entity("team_a");

    let call_index = 0;
    mock_get_use_cases.mockImplementation(() => ({
      success: true as const,
      data: {
        list: vi.fn().mockResolvedValue({
          success: true,
          data: { items: call_index++ === 0 ? [membership] : [team_a] },
        }),
      } as never,
    }));

    const result = await fetch_teams_from_player_memberships("player_1", "");

    expect(result.auto_select_team_id).toBe("team_a");
  });

  it("does not set auto_select_team_id when field already has a value", async () => {
    const membership = create_base_entity("mem_1", { team_id: "team_a" });
    const team_a = create_base_entity("team_a");

    let call_index = 0;
    mock_get_use_cases.mockImplementation(() => ({
      success: true as const,
      data: {
        list: vi.fn().mockResolvedValue({
          success: true,
          data: { items: call_index++ === 0 ? [membership] : [team_a] },
        }),
      } as never,
    }));

    const result = await fetch_teams_from_player_memberships(
      "player_1",
      "team_existing",
    );

    expect(result.auto_select_team_id).toBeUndefined();
  });
});
