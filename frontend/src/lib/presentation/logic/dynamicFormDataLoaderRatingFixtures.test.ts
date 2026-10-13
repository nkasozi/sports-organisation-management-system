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
import { fetch_fixtures_for_rating } from "./dynamicFormDataLoader";
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

describe("fetch_fixtures_for_rating", () => {
  it("returns completed fixtures for org when user has no team scope", async () => {
    mock_get.mockReturnValue({ current_profile: { id: "user-123" } } as never);
    const completed = create_base_entity("fix_a", {
      status: "completed",
      home_team_id: "team_1",
      away_team_id: "team_2",
    });
    mock_get_use_cases.mockReturnValueOnce(make_list_use_cases([completed]));

    const result = await fetch_fixtures_for_rating("org-1");

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("fix_a");
  });

  it("excludes non-completed fixtures", async () => {
    mock_get.mockReturnValue({ current_profile: { id: "user-123" } } as never);
    const scheduled = create_base_entity("fix_a", { status: "scheduled" });
    const completed = create_base_entity("fix_b", { status: "completed" });
    mock_get_use_cases.mockReturnValueOnce(
      make_list_use_cases([scheduled, completed]),
    );

    const result = await fetch_fixtures_for_rating("org-1");

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("fix_b");
  });

  it("returns all completed fixtures when user has wildcard team_id", async () => {
    mock_get.mockReturnValue({
      current_profile: { id: "user-123", team_id: "*" },
    } as never);
    const fixture_a = create_base_entity("fix_a", {
      status: "completed",
      home_team_id: "team_1",
      away_team_id: "team_3",
    });
    const fixture_b = create_base_entity("fix_b", {
      status: "completed",
      home_team_id: "team_2",
      away_team_id: "team_3",
    });
    mock_get_use_cases.mockReturnValueOnce(
      make_list_use_cases([fixture_a, fixture_b]),
    );

    const result = await fetch_fixtures_for_rating("org-1");

    expect(result).toHaveLength(2);
  });

  it("filters to team fixtures when user has a specific team_id", async () => {
    mock_get.mockReturnValue({
      current_profile: { id: "user-123", team_id: "team_1" },
    } as never);
    const team_fixture = create_base_entity("fix_a", {
      status: "completed",
      home_team_id: "team_1",
      away_team_id: "team_3",
    });
    const other_fixture = create_base_entity("fix_b", {
      status: "completed",
      home_team_id: "team_2",
      away_team_id: "team_3",
    });
    mock_get_use_cases.mockReturnValueOnce(
      make_list_use_cases([team_fixture, other_fixture]),
    );

    const result = await fetch_fixtures_for_rating("org-1");

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("fix_a");
  });

  it("includes fixture when user team is the away team", async () => {
    mock_get.mockReturnValue({
      current_profile: { id: "user-123", team_id: "team_2" },
    } as never);
    const away_team_fixture = create_base_entity("fix_a", {
      status: "completed",
      home_team_id: "team_1",
      away_team_id: "team_2",
    });
    mock_get_use_cases.mockReturnValueOnce(
      make_list_use_cases([away_team_fixture]),
    );

    const result = await fetch_fixtures_for_rating("org-1");

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("fix_a");
  });

  it("returns empty array when no completed fixtures exist", async () => {
    mock_get.mockReturnValue({ current_profile: { id: "user-123" } } as never);
    mock_get_use_cases.mockReturnValueOnce(make_list_use_cases([]));

    const result = await fetch_fixtures_for_rating("org-1");

    expect(result).toHaveLength(0);
  });

  it("uses no team filter when auth profile is missing", async () => {
    mock_get.mockReturnValue({
      current_profile: { status: "missing" },
    } as never);
    const completed = create_base_entity("fix_a", {
      status: "completed",
      home_team_id: "team_1",
      away_team_id: "team_2",
    });
    mock_get_use_cases.mockReturnValueOnce(make_list_use_cases([completed]));

    const result = await fetch_fixtures_for_rating("org-1");

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("fix_a");
  });
});
