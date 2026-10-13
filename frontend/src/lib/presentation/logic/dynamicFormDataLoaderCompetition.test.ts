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
  fetch_stages_from_competition,
  fetch_teams_from_competition,
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

describe("fetch_stages_from_competition", () => {
  it("passes competition_id filter to list call", async () => {
    const list_mock = vi
      .fn()
      .mockResolvedValue({ success: true, data: { items: [] } });
    mock_get_use_cases.mockReturnValue({
      success: true as const,
      data: { list: list_mock } as never,
    });

    await fetch_stages_from_competition("comp_1");

    expect(list_mock).toHaveBeenCalledWith(
      { competition_id: "comp_1" },
      { page_size: 100 },
    );
  });

  it("returns stage entities for the competition", async () => {
    const stage_a = create_base_entity("stage_a");
    const list_mock = vi
      .fn()
      .mockResolvedValue({ success: true, data: { items: [stage_a] } });
    mock_get_use_cases.mockReturnValue({
      success: true as const,
      data: { list: list_mock } as never,
    });

    const result = await fetch_stages_from_competition("comp_1");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("stage_a");
  });
});

describe("fetch_teams_from_competition", () => {
  it("returns teams that belong to the competition", async () => {
    const team_a = create_base_entity("team_a");
    const team_b = create_base_entity("team_b");

    mock_get_competition_team_use_cases.mockReturnValue({
      list_teams_in_competition: vi.fn().mockResolvedValue({
        success: true,
        data: { items: [{ team_id: "team_a" }] },
      }),
    } as never);

    mock_get_use_cases.mockReturnValue(make_list_use_cases([team_a, team_b]));

    const result = await fetch_teams_from_competition("comp_1", {});

    expect(result.teams).toHaveLength(1);
    expect(result.teams[0].id).toBe("team_a");
    expect(result.competition_team_ids.has("team_a")).toBe(true);
  });

  it("returns empty result when competition_team fetch fails", async () => {
    mock_get_competition_team_use_cases.mockReturnValue({
      list_teams_in_competition: vi
        .fn()
        .mockResolvedValue({ success: false, error: "not found" }),
    } as never);

    const result = await fetch_teams_from_competition("comp_1", {});

    expect(result.teams).toHaveLength(0);
    expect(result.all_competition_teams).toHaveLength(0);
  });

  it("applies exclude_field filter when provided", async () => {
    const team_a = create_base_entity("team_a");
    const team_b = create_base_entity("team_b");

    mock_get_competition_team_use_cases.mockReturnValue({
      list_teams_in_competition: vi.fn().mockResolvedValue({
        success: true,
        data: { items: [{ team_id: "team_a" }, { team_id: "team_b" }] },
      }),
    } as never);

    mock_get_use_cases.mockReturnValue(make_list_use_cases([team_a, team_b]));

    const result = await fetch_teams_from_competition(
      "comp_1",
      { away_team_id: "team_b" },
      "away_team_id",
    );

    expect(result.teams).toHaveLength(1);
    expect(result.teams[0].id).toBe("team_a");
    expect(result.all_competition_teams).toHaveLength(2);
  });
});
