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
import { fetch_fixtures_from_official } from "./dynamicFormDataLoader";
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

describe("fetch_fixtures_from_official", () => {
  it("returns completed fixtures where the official is in a FixtureDetailsSetup record", async () => {
    const fixture_a = create_base_entity("fix_a", { status: "completed" });
    const fixture_b = create_base_entity("fix_b", { status: "completed" });
    const setup_a = create_base_entity("setup_1", {
      fixture_id: "fix_a",
      assigned_officials: [{ official_id: "off-1", role_id: "r1" }],
    });
    const setup_b = create_base_entity("setup_2", {
      fixture_id: "fix_b",
      assigned_officials: [{ official_id: "off-1", role_id: "r1" }],
    });
    mock_get_use_cases
      .mockReturnValueOnce(make_list_use_cases([fixture_a, fixture_b]))
      .mockReturnValueOnce(make_list_use_cases([setup_a, setup_b]))
      .mockReturnValueOnce(make_list_use_cases([]));

    const result = await fetch_fixtures_from_official("off-1", "org-1");

    expect(result).toHaveLength(2);
    expect(result.map((f) => f.id)).toEqual(["fix_a", "fix_b"]);
  });

  it("excludes assigned fixtures that are not completed", async () => {
    const fixture_scheduled = create_base_entity("fix_a", {
      status: "scheduled",
    });
    const fixture_completed = create_base_entity("fix_b", {
      status: "completed",
    });
    const setup_a = create_base_entity("setup_1", {
      fixture_id: "fix_a",
      assigned_officials: [{ official_id: "off-1", role_id: "r1" }],
    });
    const setup_b = create_base_entity("setup_2", {
      fixture_id: "fix_b",
      assigned_officials: [{ official_id: "off-1", role_id: "r1" }],
    });
    mock_get_use_cases
      .mockReturnValueOnce(
        make_list_use_cases([fixture_scheduled, fixture_completed]),
      )
      .mockReturnValueOnce(make_list_use_cases([setup_a, setup_b]))
      .mockReturnValueOnce(make_list_use_cases([]));

    const result = await fetch_fixtures_from_official("off-1", "org-1");

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("fix_b");
  });

  it("excludes fixtures already rated by the current rater for that official", async () => {
    const fixture_a = create_base_entity("fix_a", { status: "completed" });
    const fixture_b = create_base_entity("fix_b", { status: "completed" });
    const setup_a = create_base_entity("setup_1", {
      fixture_id: "fix_a",
      assigned_officials: [{ official_id: "off-1", role_id: "r1" }],
    });
    const setup_b = create_base_entity("setup_2", {
      fixture_id: "fix_b",
      assigned_officials: [{ official_id: "off-1", role_id: "r1" }],
    });
    const existing_rating = create_base_entity("rating_1", {
      fixture_id: "fix_a",
    });
    mock_get_use_cases
      .mockReturnValueOnce(make_list_use_cases([fixture_a, fixture_b]))
      .mockReturnValueOnce(make_list_use_cases([setup_a, setup_b]))
      .mockReturnValueOnce(make_list_use_cases([existing_rating]));

    const result = await fetch_fixtures_from_official("off-1", "org-1");

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("fix_b");
  });

  it("returns empty when all assigned fixtures are already rated", async () => {
    const fixture_a = create_base_entity("fix_a", { status: "completed" });
    const setup_a = create_base_entity("setup_1", {
      fixture_id: "fix_a",
      assigned_officials: [{ official_id: "off-1", role_id: "r1" }],
    });
    const existing_rating = create_base_entity("rating_1", {
      fixture_id: "fix_a",
    });
    mock_get_use_cases
      .mockReturnValueOnce(make_list_use_cases([fixture_a]))
      .mockReturnValueOnce(make_list_use_cases([setup_a]))
      .mockReturnValueOnce(make_list_use_cases([existing_rating]));

    const result = await fetch_fixtures_from_official("off-1", "org-1");

    expect(result).toHaveLength(0);
  });

  it("excludes fixtures where the official is not in any FixtureDetailsSetup record", async () => {
    const fixture_a = create_base_entity("fix_a", { status: "completed" });
    const setup_for_other_official = create_base_entity("setup_1", {
      fixture_id: "fix_a",
      assigned_officials: [{ official_id: "off-2", role_id: "r1" }],
    });
    mock_get_use_cases
      .mockReturnValueOnce(make_list_use_cases([fixture_a]))
      .mockReturnValueOnce(make_list_use_cases([setup_for_other_official]))
      .mockReturnValueOnce(make_list_use_cases([]));

    const result = await fetch_fixtures_from_official("off-1", "org-1");

    expect(result).toHaveLength(0);
  });

  it("returns empty when no FixtureDetailsSetup records exist for the org", async () => {
    const fixture_a = create_base_entity("fix_a", { status: "completed" });
    mock_get_use_cases
      .mockReturnValueOnce(make_list_use_cases([fixture_a]))
      .mockReturnValueOnce(make_list_use_cases([]))
      .mockReturnValueOnce(make_list_use_cases([]));

    const result = await fetch_fixtures_from_official("off-1", "org-1");

    expect(result).toHaveLength(0);
  });

  it("uses empty string as rater_user_id when auth profile is missing", async () => {
    mock_get.mockReturnValue({
      current_profile: { status: "missing" },
    } as never);
    const fixture_a = create_base_entity("fix_a", { status: "completed" });
    const setup_a = create_base_entity("setup_1", {
      fixture_id: "fix_a",
      assigned_officials: [{ official_id: "off-1", role_id: "r1" }],
    });
    mock_get_use_cases
      .mockReturnValueOnce(make_list_use_cases([fixture_a]))
      .mockReturnValueOnce(make_list_use_cases([setup_a]))
      .mockReturnValueOnce(make_list_use_cases([]));

    const result = await fetch_fixtures_from_official("off-1", "org-1");

    expect(result).toHaveLength(1);
    expect(mock_get_use_cases).toHaveBeenCalledWith(
      "officialperformancerating",
    );
  });
});
