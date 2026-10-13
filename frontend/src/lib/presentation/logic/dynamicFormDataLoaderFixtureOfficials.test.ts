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
import { fetch_officials_from_fixture } from "./dynamicFormDataLoader";
import {
  create_base_entity,
  make_fixture_use_cases_with_data,
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

describe("fetch_officials_from_fixture", () => {
  it("returns officials with Name-Role display labels", async () => {
    const fixture_data = {
      id: "fix-1",
      assigned_officials: [
        { official_id: "off-1", role_id: "r1", role_name: "Referee" },
      ],
    };
    const official = create_base_entity("off-1", {
      first_name: "John",
      last_name: "Doe",
    });

    mock_get_use_cases
      .mockReturnValueOnce(make_fixture_use_cases_with_data(fixture_data))
      .mockReturnValueOnce(make_list_use_cases([]))
      .mockReturnValueOnce(make_list_use_cases([official]));

    const result = await fetch_officials_from_fixture("fix-1", "org-1");

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ name: "John Doe - Referee" });
  });

  it("excludes officials already rated for this fixture by the current rater", async () => {
    const fixture_data = {
      id: "fix-1",
      assigned_officials: [
        { official_id: "off-1", role_id: "r1", role_name: "Referee" },
        { official_id: "off-2", role_id: "r2", role_name: "Assistant" },
      ],
    };
    const official_1 = create_base_entity("off-1", {
      first_name: "John",
      last_name: "Doe",
    });
    const official_2 = create_base_entity("off-2", {
      first_name: "Jane",
      last_name: "Smith",
    });
    const existing_rating = create_base_entity("rating-1", {
      official_id: "off-1",
    });

    mock_get_use_cases
      .mockReturnValueOnce(make_fixture_use_cases_with_data(fixture_data))
      .mockReturnValueOnce(make_list_use_cases([existing_rating]))
      .mockReturnValueOnce(make_list_use_cases([official_1, official_2]));

    const result = await fetch_officials_from_fixture("fix-1", "org-1");

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ name: "Jane Smith - Assistant" });
  });

  it("returns empty when fixture has no assigned officials", async () => {
    const fixture_data = { id: "fix-1", assigned_officials: [] };

    mock_get_use_cases
      .mockReturnValueOnce(make_fixture_use_cases_with_data(fixture_data))
      .mockReturnValueOnce(make_list_use_cases([]))
      .mockReturnValueOnce(make_list_use_cases([]));

    const result = await fetch_officials_from_fixture("fix-1", "org-1");

    expect(result).toHaveLength(0);
  });

  it("returns empty when fixture is not found", async () => {
    mock_get_use_cases
      .mockReturnValueOnce(make_fixture_use_cases_with_data(void 0, false))
      .mockReturnValueOnce(make_list_use_cases([]))
      .mockReturnValueOnce(make_list_use_cases([]));

    const result = await fetch_officials_from_fixture("fix-missing", "org-1");

    expect(result).toHaveLength(0);
  });

  it("returns empty when assigned official is not in org officials list", async () => {
    const fixture_data = {
      id: "fix-1",
      assigned_officials: [
        { official_id: "off-999", role_id: "r1", role_name: "Referee" },
      ],
    };

    mock_get_use_cases
      .mockReturnValueOnce(make_fixture_use_cases_with_data(fixture_data))
      .mockReturnValueOnce(make_list_use_cases([]))
      .mockReturnValueOnce(make_list_use_cases([]));

    const result = await fetch_officials_from_fixture("fix-1", "org-1");

    expect(result).toHaveLength(0);
  });

  it("uses empty rater_user_id when auth profile is missing", async () => {
    mock_get.mockReturnValue({
      current_profile: { status: "missing" },
    } as never);
    const fixture_data = {
      id: "fix-1",
      assigned_officials: [
        { official_id: "off-1", role_id: "r1", role_name: "Referee" },
      ],
    };
    const official = create_base_entity("off-1", {
      first_name: "Alice",
      last_name: "Brown",
    });

    mock_get_use_cases
      .mockReturnValueOnce(make_fixture_use_cases_with_data(fixture_data))
      .mockReturnValueOnce(make_list_use_cases([]))
      .mockReturnValueOnce(make_list_use_cases([official]));

    const result = await fetch_officials_from_fixture("fix-1", "org-1");

    expect(result).toHaveLength(1);
    expect(mock_get_use_cases).toHaveBeenCalledWith(
      "officialperformancerating",
    );
  });
});
