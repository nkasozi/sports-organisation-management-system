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
import { fetch_filtered_entities_for_field } from "./dynamicFormDataLoader";
import {
  create_base_entity,
  create_field_metadata,
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

describe("fetch_filtered_entities_for_field", () => {
  it("delegates competitions_from_organization to fetch_entities_filtered_by_organization", async () => {
    const comp = create_base_entity("comp_1", { organization_id: "org_1" });
    mock_get_use_cases.mockReturnValue(make_list_use_cases([comp]));

    const field = create_field_metadata({
      field_name: "competition_id",
      foreign_key_filter: {
        filter_type: "competitions_from_organization",
      } as never,
    });

    const result = await fetch_filtered_entities_for_field(
      field,
      "org_1",
      [],
      {},
    );

    expect(result.entities).toHaveLength(1);
    expect(result.entities[0].id).toBe("comp_1");
  });

  it("delegates stages_from_competition to fetch_stages_from_competition", async () => {
    const stage = create_base_entity("stage_1");
    const list_mock = vi
      .fn()
      .mockResolvedValue({ success: true, data: { items: [stage] } });
    mock_get_use_cases.mockReturnValue({
      success: true as const,
      data: { list: list_mock } as never,
    });

    const field = create_field_metadata({
      field_name: "stage_id",
      foreign_key_filter: { filter_type: "stages_from_competition" } as never,
    });

    const result = await fetch_filtered_entities_for_field(
      field,
      "comp_1",
      [],
      {},
    );

    expect(result.entities).toHaveLength(1);
    expect(list_mock).toHaveBeenCalledWith(
      { competition_id: "comp_1" },
      { page_size: 100 },
    );
  });

  it("delegates teams_from_competition and returns cache fields", async () => {
    const team_a = create_base_entity("team_a");
    mock_get_competition_team_use_cases.mockReturnValue({
      list_teams_in_competition: vi.fn().mockResolvedValue({
        success: true,
        data: { items: [{ team_id: "team_a" }] },
      }),
    } as never);
    mock_get_use_cases.mockReturnValue(make_list_use_cases([team_a]));

    const field = create_field_metadata({
      field_name: "home_team_id",
      foreign_key_filter: { filter_type: "teams_from_competition" } as never,
    });

    const result = await fetch_filtered_entities_for_field(
      field,
      "comp_1",
      [],
      {},
    );

    expect(result.entities).toHaveLength(1);
    expect(result.all_competition_teams).toBeDefined();
    expect(result.competition_team_ids).toBeDefined();
    expect(result.competition_team_ids?.has("team_a")).toBe(true);
  });

  it("delegates teams_from_player_memberships and returns auto_select_team_id", async () => {
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

    const field = create_field_metadata({
      field_name: "team_id",
      foreign_key_filter: {
        filter_type: "teams_from_player_memberships",
      } as never,
    });

    const result = await fetch_filtered_entities_for_field(
      field,
      "player_1",
      [],
      {},
    );

    expect(result.entities).toHaveLength(1);
    expect(result.auto_select_team_id).toBe("team_a");
  });

  it("delegates fixtures_from_official to fetch_fixtures_from_official", async () => {
    const fixture = create_base_entity("fix_1", { status: "completed" });
    const setup = create_base_entity("setup_1", {
      fixture_id: "fix_1",
      assigned_officials: [{ official_id: "off-1", role_id: "r1" }],
    });
    mock_get_use_cases
      .mockReturnValueOnce(make_list_use_cases([fixture]))
      .mockReturnValueOnce(make_list_use_cases([setup]))
      .mockReturnValueOnce(make_list_use_cases([]));

    const field = create_field_metadata({
      field_name: "fixture_id",
      foreign_key_filter: { filter_type: "fixtures_from_official" } as never,
    });

    const result = await fetch_filtered_entities_for_field(field, "off-1", [], {
      organization_id: "org-1",
    });

    expect(result.entities).toHaveLength(1);
    expect(result.entities[0].id).toBe("fix_1");
  });
});
