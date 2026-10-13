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
import {
  compute_teams_after_exclusion,
  fetch_entities_for_type,
} from "./dynamicFormDataLoader";
import {
  create_base_entity,
  make_list_use_cases,
} from "./dynamicFormDataLoader.test_support";

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

describe("compute_teams_after_exclusion", () => {
  const team_a = create_base_entity("team_a");
  const team_b = create_base_entity("team_b");
  const team_c = create_base_entity("team_c");
  const all_teams = [team_a, team_b, team_c];

  it("returns all teams when exclude_value is empty", () => {
    const result = compute_teams_after_exclusion(all_teams, "");
    expect(result).toHaveLength(3);
    expect(result).toContainEqual(team_a);
  });

  it("excludes the specified team", () => {
    const result = compute_teams_after_exclusion(all_teams, "team_b");
    expect(result).toHaveLength(2);
    expect(result.map((t) => t.id)).not.toContain("team_b");
  });

  it("returns all teams unchanged when exclude_value matches no team", () => {
    const result = compute_teams_after_exclusion(all_teams, "team_z");
    expect(result).toHaveLength(3);
  });

  it("returns empty array when input is empty", () => {
    const result = compute_teams_after_exclusion([], "team_a");
    expect(result).toHaveLength(0);
  });

  it("does not mutate the input array", () => {
    const original_length = all_teams.length;
    compute_teams_after_exclusion(all_teams, "team_a");
    expect(all_teams).toHaveLength(original_length);
  });
});

describe("fetch_entities_for_type", () => {
  it("returns entities from items array response", async () => {
    const team_a = create_base_entity("team_a");
    mock_get_use_cases.mockReturnValue(make_list_use_cases([team_a]));

    const result = await fetch_entities_for_type("team");

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("team_a");
  });

  it("returns flat array response", async () => {
    const team_a = create_base_entity("team_a");
    mock_get_use_cases.mockReturnValue({
      success: true as const,
      data: {
        list: vi.fn().mockResolvedValue({ success: true, data: [team_a] }),
      } as never,
    });

    const result = await fetch_entities_for_type("team");
    expect(result).toHaveLength(1);
  });

  it("returns empty array when use cases missing", async () => {
    mock_get_use_cases.mockReturnValue({
      success: false,
      error: "Unknown entity type",
    });

    const result = await fetch_entities_for_type("unknown_type");
    expect(result).toHaveLength(0);
  });

  it("returns empty array on failed fetch", async () => {
    mock_get_use_cases.mockReturnValue(make_list_use_cases([], false));

    const result = await fetch_entities_for_type("team");
    expect(result).toHaveLength(0);
  });

  it("passes filter and page_size to the use case list method", async () => {
    const list_mock = vi
      .fn()
      .mockResolvedValue({ success: true, data: { items: [] } });
    mock_get_use_cases.mockReturnValue({
      success: true as const,
      data: { list: list_mock } as never,
    });

    await fetch_entities_for_type("team", { organization_id: "org_1" }, 50);

    expect(list_mock).toHaveBeenCalledWith(
      { organization_id: "org_1" },
      { page_size: 50 },
    );
  });
});
