import { get } from "svelte/store";
import {
  beforeEach,
  describe,
  expect,
  it,
  type MockedFunction,
  vi,
} from "vitest";

import type { FieldMetadata } from "../../core/entities/BaseEntity";
import { get_use_cases_for_entity_type } from "../../infrastructure/registry/entityUseCasesRegistry";
import { get_competition_team_use_cases } from "../../infrastructure/registry/useCaseFactories";
import {
  fetch_entities_filtered_by_organization,
  fetch_unfiltered_foreign_key_options,
} from "./dynamicFormDataLoader";
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

describe("fetch_unfiltered_foreign_key_options", () => {
  it("loads options for all unfiltered foreign_key fields", async () => {
    const player_a = create_base_entity("player_a");
    mock_get_use_cases.mockReturnValue(make_list_use_cases([player_a]));

    const fields = [
      create_field_metadata({
        field_name: "player_id",
        field_type: "foreign_key",
        foreign_key_entity: "player",
      }),
    ] as FieldMetadata[];

    const result = await fetch_unfiltered_foreign_key_options(fields);

    expect(result["player_id"]).toHaveLength(1);
    expect(result["player_id"][0].id).toBe("player_a");
  });

  it("skips fields that have a foreign_key_filter", async () => {
    const list_mock = vi
      .fn()
      .mockResolvedValue({ success: true, data: { items: [] } });
    mock_get_use_cases.mockReturnValue({
      success: true as const,
      data: { list: list_mock } as never,
    });

    const fields = [
      create_field_metadata({
        field_name: "team_id",
        field_type: "foreign_key",
        foreign_key_entity: "team",
        foreign_key_filter: { filter_type: "teams_from_competition" } as never,
      }),
    ] as FieldMetadata[];

    const result = await fetch_unfiltered_foreign_key_options(fields);

    expect(list_mock).not.toHaveBeenCalled();
    expect(Object.keys(result)).toHaveLength(0);
  });

  it("skips non-foreign_key fields", async () => {
    const list_mock = vi
      .fn()
      .mockResolvedValue({ success: true, data: { items: [] } });
    mock_get_use_cases.mockReturnValue({
      success: true as const,
      data: { list: list_mock } as never,
    });

    const fields = [
      create_field_metadata({ field_name: "name", field_type: "string" }),
    ] as FieldMetadata[];

    const result = await fetch_unfiltered_foreign_key_options(fields);

    expect(list_mock).not.toHaveBeenCalled();
    expect(Object.keys(result)).toHaveLength(0);
  });

  it("loads multiple fields in sequence", async () => {
    const entity_a = create_base_entity("entity_a");
    const entity_b = create_base_entity("entity_b");
    let call_count = 0;
    mock_get_use_cases.mockImplementation(() => ({
      success: true as const,
      data: {
        list: vi.fn().mockResolvedValue({
          success: true,
          data: { items: call_count++ === 0 ? [entity_a] : [entity_b] },
        }),
      } as never,
    }));

    const fields = [
      create_field_metadata({
        field_name: "player_id",
        field_type: "foreign_key",
        foreign_key_entity: "player",
      }),
      create_field_metadata({
        field_name: "team_id",
        field_type: "foreign_key",
        foreign_key_entity: "team",
      }),
    ] as FieldMetadata[];

    const result = await fetch_unfiltered_foreign_key_options(fields);

    expect(Object.keys(result)).toHaveLength(2);
    expect(result["player_id"][0].id).toBe("entity_a");
    expect(result["team_id"][0].id).toBe("entity_b");
  });
});

describe("fetch_entities_filtered_by_organization", () => {
  it("returns only entities matching the organization_id", async () => {
    const team_in_org = create_base_entity("team_1", {
      organization_id: "org_1",
    });
    const team_other = create_base_entity("team_2", {
      organization_id: "org_2",
    });
    mock_get_use_cases.mockReturnValue(
      make_list_use_cases([team_in_org, team_other]),
    );

    const result = await fetch_entities_filtered_by_organization(
      "team",
      "org_1",
    );

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("team_1");
  });

  it("returns empty array when no entities match organization", async () => {
    const team = create_base_entity("team_1", { organization_id: "org_2" });
    mock_get_use_cases.mockReturnValue(make_list_use_cases([team]));

    const result = await fetch_entities_filtered_by_organization(
      "team",
      "org_1",
    );
    expect(result).toHaveLength(0);
  });
});
