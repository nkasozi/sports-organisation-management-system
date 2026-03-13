import { describe, it, expect, vi, beforeEach, type MockedFunction } from "vitest";
import type { BaseEntity, FieldMetadata } from "../../core/entities/BaseEntity";
import { get_use_cases_for_entity_type } from "../../infrastructure/registry/entityUseCasesRegistry";
import { get_competition_team_use_cases } from "../../core/usecases/CompetitionTeamUseCases";
import {
  compute_teams_after_exclusion,
  fetch_entities_for_type,
  fetch_unfiltered_foreign_key_options,
  fetch_teams_from_competition,
  fetch_entities_filtered_by_organization,
  fetch_stages_from_competition,
  fetch_teams_from_player_memberships,
  fetch_teams_excluding_player_memberships,
  fetch_filtered_entities_for_field,
} from "./dynamicFormDataLoader";

vi.mock("../../infrastructure/registry/entityUseCasesRegistry");
vi.mock("../../core/usecases/CompetitionTeamUseCases");

const mock_get_use_cases = get_use_cases_for_entity_type as MockedFunction<
  typeof get_use_cases_for_entity_type
>;
const mock_get_competition_team_use_cases =
  get_competition_team_use_cases as MockedFunction<
    typeof get_competition_team_use_cases
  >;

function create_base_entity(id: string, overrides: Record<string, unknown> = {}): BaseEntity {
  return { id, created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z", ...overrides };
}

function create_field_metadata(overrides: Partial<FieldMetadata> = {}): FieldMetadata {
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
      list: vi.fn().mockResolvedValue(
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
    mock_get_use_cases.mockReturnValue({ success: false, error: "Unknown entity type" });

    const result = await fetch_entities_for_type("unknown_type");
    expect(result).toHaveLength(0);
  });

  it("returns empty array on failed fetch", async () => {
    mock_get_use_cases.mockReturnValue(make_list_use_cases([], false));

    const result = await fetch_entities_for_type("team");
    expect(result).toHaveLength(0);
  });

  it("passes filter and page_size to the use case list method", async () => {
    const list_mock = vi.fn().mockResolvedValue({ success: true, data: { items: [] } });
    mock_get_use_cases.mockReturnValue({ success: true as const, data: { list: list_mock } as any });

    await fetch_entities_for_type("team", { organization_id: "org_1" }, 50);

    expect(list_mock).toHaveBeenCalledWith({ organization_id: "org_1" }, { page_size: 50 });
  });
});

describe("fetch_unfiltered_foreign_key_options", () => {
  it("loads options for all unfiltered foreign_key fields", async () => {
    const player_a = create_base_entity("player_a");
    mock_get_use_cases.mockReturnValue(make_list_use_cases([player_a]));

    const fields: FieldMetadata[] = [
      create_field_metadata({ field_name: "player_id", field_type: "foreign_key", foreign_key_entity: "player" }),
    ];

    const result = await fetch_unfiltered_foreign_key_options(fields);

    expect(result["player_id"]).toHaveLength(1);
    expect(result["player_id"][0].id).toBe("player_a");
  });

  it("skips fields that have a foreign_key_filter", async () => {
    const list_mock = vi.fn().mockResolvedValue({ success: true, data: { items: [] } });
    mock_get_use_cases.mockReturnValue({ success: true as const, data: { list: list_mock } as any });

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
    const list_mock = vi.fn().mockResolvedValue({ success: true, data: { items: [] } });
    mock_get_use_cases.mockReturnValue({ success: true as const, data: { list: list_mock } as any });

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
      create_field_metadata({ field_name: "player_id", field_type: "foreign_key", foreign_key_entity: "player" }),
      create_field_metadata({ field_name: "team_id", field_type: "foreign_key", foreign_key_entity: "team" }),
    ];

    const result = await fetch_unfiltered_foreign_key_options(fields);

    expect(Object.keys(result)).toHaveLength(2);
    expect(result["player_id"][0].id).toBe("entity_a");
    expect(result["team_id"][0].id).toBe("entity_b");
  });
});

describe("fetch_entities_filtered_by_organization", () => {
  it("returns only entities matching the organization_id", async () => {
    const team_in_org = create_base_entity("team_1", { organization_id: "org_1" });
    const team_other = create_base_entity("team_2", { organization_id: "org_2" });
    mock_get_use_cases.mockReturnValue(make_list_use_cases([team_in_org, team_other]));

    const result = await fetch_entities_filtered_by_organization("team", "org_1");

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("team_1");
  });

  it("returns empty array when no entities match organization", async () => {
    const team = create_base_entity("team_1", { organization_id: "org_2" });
    mock_get_use_cases.mockReturnValue(make_list_use_cases([team]));

    const result = await fetch_entities_filtered_by_organization("team", "org_1");
    expect(result).toHaveLength(0);
  });
});

describe("fetch_stages_from_competition", () => {
  it("passes competition_id filter to list call", async () => {
    const list_mock = vi.fn().mockResolvedValue({ success: true, data: { items: [] } });
    mock_get_use_cases.mockReturnValue({ success: true as const, data: { list: list_mock } as any });

    await fetch_stages_from_competition("comp_1");

    expect(list_mock).toHaveBeenCalledWith({ competition_id: "comp_1" }, { page_size: 100 });
  });

  it("returns stage entities for the competition", async () => {
    const stage_a = create_base_entity("stage_a");
    const list_mock = vi.fn().mockResolvedValue({ success: true, data: { items: [stage_a] } });
    mock_get_use_cases.mockReturnValue({ success: true as const, data: { list: list_mock } as any });

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
      list_teams_in_competition: vi.fn().mockResolvedValue({ success: false, error: "not found" }),
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

    const result = await fetch_teams_from_competition("comp_1", { away_team_id: "team_b" }, "away_team_id");

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

    const result = await fetch_teams_from_player_memberships("player_1", undefined);

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

    const result = await fetch_teams_from_player_memberships("player_1", undefined);

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

    const result = await fetch_teams_from_player_memberships("player_1", "team_existing");

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

    const result = await fetch_teams_excluding_player_memberships("player_1", [], undefined);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("team_b");
  });

  it("filters by organization_id when provided", async () => {
    const team_in_org = create_base_entity("team_in_org", { organization_id: "org_1" });
    const team_other_org = create_base_entity("team_other", { organization_id: "org_2" });

    let call_index = 0;
    mock_get_use_cases.mockImplementation(() => ({
      success: true as const,
      data: {
        list: vi.fn().mockResolvedValue({
          success: true,
          data: { items: call_index++ === 0 ? [] : [team_in_org, team_other_org] },
        }),
      } as any,
    }));

    const result = await fetch_teams_excluding_player_memberships("player_1", [], "org_1");

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("team_in_org");
  });

  it("filters by gender when player has a gender and team has a gender", async () => {
    const player = create_base_entity("player_1", { gender_id: "gender_male" });
    const team_male = create_base_entity("team_a", { gender_id: "gender_male" });
    const team_female = create_base_entity("team_b", { gender_id: "gender_female" });
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

    const result = await fetch_teams_excluding_player_memberships("player_1", cached_players, undefined);

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
      foreign_key_filter: { filter_type: "competitions_from_organization" } as any,
    });

    const result = await fetch_filtered_entities_for_field(field, "org_1", [], {});

    expect(result.entities).toHaveLength(1);
    expect(result.entities[0].id).toBe("comp_1");
  });

  it("delegates stages_from_competition to fetch_stages_from_competition", async () => {
    const stage = create_base_entity("stage_1");
    const list_mock = vi.fn().mockResolvedValue({ success: true, data: { items: [stage] } });
    mock_get_use_cases.mockReturnValue({ success: true as const, data: { list: list_mock } as any });

    const field = create_field_metadata({
      field_name: "stage_id",
      foreign_key_filter: { filter_type: "stages_from_competition" } as any,
    });

    const result = await fetch_filtered_entities_for_field(field, "comp_1", [], {});

    expect(result.entities).toHaveLength(1);
    expect(list_mock).toHaveBeenCalledWith({ competition_id: "comp_1" }, { page_size: 100 });
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

    const result = await fetch_filtered_entities_for_field(field, "comp_1", [], {});

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
      foreign_key_filter: { filter_type: "teams_from_player_memberships" } as any,
    });

    const result = await fetch_filtered_entities_for_field(field, "player_1", [], {});

    expect(result.entities).toHaveLength(1);
    expect(result.auto_select_team_id).toBe("team_a");
  });
});
