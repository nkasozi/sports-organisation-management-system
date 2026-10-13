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
  fetch_filtered_entities_for_field,
  fetch_fixtures_without_setup,
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

describe("fetch_fixtures_without_setup", () => {
  it("returns fixtures that have no fixturedetailssetup record", async () => {
    const fixture_a = create_base_entity("fix_a");
    const fixture_b = create_base_entity("fix_b");
    const setup_for_b = create_base_entity("setup_1", { fixture_id: "fix_b" });
    mock_get_use_cases
      .mockReturnValueOnce(make_list_use_cases([fixture_a, fixture_b]))
      .mockReturnValueOnce(make_list_use_cases([setup_for_b]));

    const result = await fetch_fixtures_without_setup("org-1");

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("fix_a");
  });

  it("returns all fixtures when no setups exist", async () => {
    const fixture_a = create_base_entity("fix_a");
    const fixture_b = create_base_entity("fix_b");
    mock_get_use_cases
      .mockReturnValueOnce(make_list_use_cases([fixture_a, fixture_b]))
      .mockReturnValueOnce(make_list_use_cases([]));

    const result = await fetch_fixtures_without_setup("org-1");

    expect(result).toHaveLength(2);
  });

  it("returns empty when all fixtures already have a setup", async () => {
    const fixture_a = create_base_entity("fix_a");
    const setup_a = create_base_entity("setup_1", { fixture_id: "fix_a" });
    mock_get_use_cases
      .mockReturnValueOnce(make_list_use_cases([fixture_a]))
      .mockReturnValueOnce(make_list_use_cases([setup_a]));

    const result = await fetch_fixtures_without_setup("org-1");

    expect(result).toHaveLength(0);
  });

  it("returns empty when no fixtures exist", async () => {
    mock_get_use_cases
      .mockReturnValueOnce(make_list_use_cases([]))
      .mockReturnValueOnce(make_list_use_cases([]));

    const result = await fetch_fixtures_without_setup("org-1");

    expect(result).toHaveLength(0);
  });

  it("delegates fixtures_without_setup filter_type in fetch_filtered_entities_for_field", async () => {
    const fixture_a = create_base_entity("fix_a");
    mock_get_use_cases
      .mockReturnValueOnce(make_list_use_cases([fixture_a]))
      .mockReturnValueOnce(make_list_use_cases([]));

    const field = create_field_metadata({
      field_name: "fixture_id",
      foreign_key_filter: { filter_type: "fixtures_without_setup" } as never,
    });

    const result = await fetch_filtered_entities_for_field(
      field,
      "org-1",
      [],
      {},
    );

    expect(result.entities).toHaveLength(1);
    expect(result.entities[0].id).toBe("fix_a");
  });
});
