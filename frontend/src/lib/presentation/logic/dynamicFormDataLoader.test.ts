import { get } from "svelte/store";
import {
  beforeEach,
  describe,
  expect,
  it,
  type MockedFunction,
  vi,
} from "vitest";

import type { BaseEntity, FieldMetadata } from "../../core/entities/BaseEntity";
import { get_use_cases_for_entity_type } from "../../infrastructure/registry/entityUseCasesRegistry";
import { get_competition_team_use_cases } from "../../infrastructure/registry/useCaseFactories";
import {
  compute_teams_after_exclusion,
  fetch_entities_filtered_by_organization,
  fetch_entities_for_type,
  fetch_filtered_entities_for_field,
  fetch_fixtures_for_rating,
  fetch_fixtures_from_official,
  fetch_fixtures_without_setup,
  fetch_officials_from_fixture,
  fetch_stages_from_competition,
  fetch_teams_excluding_player_memberships,
  fetch_teams_from_competition,
  fetch_teams_from_player_memberships,
  fetch_unfiltered_foreign_key_options,
} from "./dynamicFormDataLoader";

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

function create_base_entity(
  id: string,
  overrides: Record<string, unknown> = {},
): BaseEntity {
  return {
    id,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

function create_field_metadata(
  overrides: Partial<FieldMetadata> = {},
): FieldMetadata {
  return {
    field_name: "test_field",
    display_name: "Test Field",
    field_type: "foreign_key",
    is_required: false,
    is_read_only: false,
    ...overrides,
  };
}

function make_list_use_cases(entities: BaseEntity[], success = true) {
  return {
    success: true as const,
    data: {
      list: vi
        .fn()
        .mockResolvedValue(
          success
            ? { success: true, data: { items: entities } }
            : { success: false, error: "fetch error" },
        ),
      get_by_id: vi.fn(),
    } as any,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mock_get.mockReturnValue({ current_profile: { id: "user-123" } } as any);
});

describe("compute_teams_after_exclusion", () => {
  const team_a = create_base_entity("team_a");
  const team_b = create_base_entity("team_b");
  const team_c = create_base_entity("team_c");
  const all_teams = [team_a, team_b, team_c];

  it("returns all teams when exclude_value is null", () => {
    const result = compute_teams_after_exclusion(all_teams, null);
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
      } as any,
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
      data: { list: list_mock } as any,
    });

    await fetch_entities_for_type("team", { organization_id: "org_1" }, 50);

    expect(list_mock).toHaveBeenCalledWith(
      { organization_id: "org_1" },
      { page_size: 50 },
    );
  });
});

describe("fetch_unfiltered_foreign_key_options", () => {
  it("loads options for all unfiltered foreign_key fields", async () => {
    const player_a = create_base_entity("player_a");
    mock_get_use_cases.mockReturnValue(make_list_use_cases([player_a]));

    const fields: FieldMetadata[] = [
      create_field_metadata({
        field_name: "player_id",
        field_type: "foreign_key",
        foreign_key_entity: "player",
      }),
    ];

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
      data: { list: list_mock } as any,
    });

    const fields: FieldMetadata[] = [
      create_field_metadata({
        field_name: "team_id",
        field_type: "foreign_key",
        foreign_key_entity: "team",
        foreign_key_filter: { filter_type: "teams_from_competition" } as any,
      }),
    ];

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
      data: { list: list_mock } as any,
    });

    const fields: FieldMetadata[] = [
      create_field_metadata({ field_name: "name", field_type: "string" }),
    ];

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
      } as any,
    }));

    const fields: FieldMetadata[] = [
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
    ];

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

describe("fetch_stages_from_competition", () => {
  it("passes competition_id filter to list call", async () => {
    const list_mock = vi
      .fn()
      .mockResolvedValue({ success: true, data: { items: [] } });
    mock_get_use_cases.mockReturnValue({
      success: true as const,
      data: { list: list_mock } as any,
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
      data: { list: list_mock } as any,
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
    } as any);

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
    } as any);

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
    } as any);

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
      } as any,
    }));

    const result = await fetch_teams_from_player_memberships(
      "player_1",
      undefined,
    );

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
      } as any,
    }));

    const result = await fetch_teams_from_player_memberships(
      "player_1",
      undefined,
    );

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
      } as any,
    }));

    const result = await fetch_teams_from_player_memberships(
      "player_1",
      "team_existing",
    );

    expect(result.auto_select_team_id).toBeUndefined();
  });
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
      } as any,
    }));

    const result = await fetch_teams_excluding_player_memberships(
      "player_1",
      [],
      undefined,
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
      } as any,
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
      } as any,
    }));

    const result = await fetch_teams_excluding_player_memberships(
      "player_1",
      cached_players,
      undefined,
    );

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("team_a");
  });
});

describe("fetch_filtered_entities_for_field", () => {
  it("delegates competitions_from_organization to fetch_entities_filtered_by_organization", async () => {
    const comp = create_base_entity("comp_1", { organization_id: "org_1" });
    mock_get_use_cases.mockReturnValue(make_list_use_cases([comp]));

    const field = create_field_metadata({
      field_name: "competition_id",
      foreign_key_filter: {
        filter_type: "competitions_from_organization",
      } as any,
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
      data: { list: list_mock } as any,
    });

    const field = create_field_metadata({
      field_name: "stage_id",
      foreign_key_filter: { filter_type: "stages_from_competition" } as any,
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
    } as any);
    mock_get_use_cases.mockReturnValue(make_list_use_cases([team_a]));

    const field = create_field_metadata({
      field_name: "home_team_id",
      foreign_key_filter: { filter_type: "teams_from_competition" } as any,
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
      } as any,
    }));

    const field = create_field_metadata({
      field_name: "team_id",
      foreign_key_filter: {
        filter_type: "teams_from_player_memberships",
      } as any,
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
      foreign_key_filter: { filter_type: "fixtures_from_official" } as any,
    });

    const result = await fetch_filtered_entities_for_field(field, "off-1", [], {
      organization_id: "org-1",
    });

    expect(result.entities).toHaveLength(1);
    expect(result.entities[0].id).toBe("fix_1");
  });
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

  it("uses empty string as rater_user_id when auth profile is null", async () => {
    mock_get.mockReturnValue({ current_profile: null } as any);
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

function make_fixture_use_cases_with_data(
  fixture_data: unknown,
  success = true,
) {
  return {
    success: true as const,
    data: {
      list: vi.fn(),
      get_by_id: vi
        .fn()
        .mockResolvedValue(
          success
            ? { success: true, data: fixture_data }
            : { success: false, error: "not found" },
        ),
    } as any,
  };
}

describe("fetch_fixtures_for_rating", () => {
  it("returns completed fixtures for org when user has no team scope", async () => {
    mock_get.mockReturnValue({ current_profile: { id: "user-123" } } as any);
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
    mock_get.mockReturnValue({ current_profile: { id: "user-123" } } as any);
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
    } as any);
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
    } as any);
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
    } as any);
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
    mock_get.mockReturnValue({ current_profile: { id: "user-123" } } as any);
    mock_get_use_cases.mockReturnValueOnce(make_list_use_cases([]));

    const result = await fetch_fixtures_for_rating("org-1");

    expect(result).toHaveLength(0);
  });

  it("uses no team filter when auth profile is null", async () => {
    mock_get.mockReturnValue({ current_profile: null } as any);
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
    expect((result[0] as any).name).toBe("John Doe - Referee");
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
    expect((result[0] as any).name).toBe("Jane Smith - Assistant");
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
    mock_get_use_cases.mockReturnValueOnce(
      make_fixture_use_cases_with_data(null, false),
    );

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

  it("uses empty rater_user_id when auth profile is null", async () => {
    mock_get.mockReturnValue({ current_profile: null } as any);
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
      foreign_key_filter: { filter_type: "fixtures_without_setup" } as any,
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
