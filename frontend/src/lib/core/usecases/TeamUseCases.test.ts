import { describe, it, expect, beforeEach, vi } from "vitest";
import type {
  TeamRepository,
  TeamFilter,
} from "../interfaces/adapters/TeamRepository";
import type { QueryOptions } from "../interfaces/adapters/Repository";
import type { Team, CreateTeamInput, UpdateTeamInput } from "../entities/Team";
import type { Result, PaginatedResult } from "../types/Result";
import { create_team_use_cases } from "./TeamUseCases";

function create_mock_team(overrides: Partial<Team> = {}): Team {
  return {
    id: "team_1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    name: "Test Team FC",
    short_name: "TTF",
    description: "A test team",
    organization_id: "org_1",
    captain_player_id: null,
    vice_captain_player_id: null,
    max_squad_size: 25,
    home_venue_id: "",
    primary_color: "#3B82F6",
    secondary_color: "#FFFFFF",
    logo_url: "",
    website: "",
    founded_year: 2020,
    status: "active",
    ...overrides,
  };
}

function create_valid_team_input(
  overrides: Partial<CreateTeamInput> = {},
): CreateTeamInput {
  return {
    name: "Test Team FC",
    short_name: "TTF",
    description: "A test team",
    organization_id: "org_1",
    captain_player_id: null,
    vice_captain_player_id: null,
    max_squad_size: 25,
    home_venue_id: "",
    primary_color: "#3B82F6",
    secondary_color: "#FFFFFF",
    logo_url: "",
    website: "",
    founded_year: 2020,
    status: "active",
    ...overrides,
  };
}

function create_paginated_result<T>(
  items: T[],
  total_count?: number,
): Result<PaginatedResult<T>, string> {
  return {
    success: true,
    data: {
      items,
      total_count: total_count ?? items.length,
      page_number: 1,
      page_size: 10,
      total_pages: Math.ceil((total_count ?? items.length) / 10),
    },
  };
}

function create_mock_repository(): TeamRepository {
  return {
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    find_by_ids: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    delete_by_ids: vi.fn(),
    count: vi.fn(),
    find_by_filter: vi.fn(),
    find_by_organization: vi.fn(),
    find_active_teams: vi.fn(),
  };
}

describe("TeamUseCases", () => {
  let mock_repository: TeamRepository;
  let use_cases: ReturnType<typeof create_team_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_team_use_cases(mock_repository);
  });

  describe("list", () => {
    it("returns all teams when no filter provided", async () => {
      const mock_teams = [
        create_mock_team({ id: "t1" }),
        create_mock_team({ id: "t2" }),
      ];
      vi.mocked(mock_repository.find_all).mockResolvedValue(
        create_paginated_result(mock_teams),
      );

      const result = await use_cases.list();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.total_count).toBe(2);
      expect(mock_repository.find_all).toHaveBeenCalledOnce();
    });

    it("returns filtered teams when filter provided", async () => {
      const mock_teams = [
        create_mock_team({ id: "t1", organization_id: "org_1" }),
      ];
      const filter: TeamFilter = { organization_id: "org_1" };
      vi.mocked(mock_repository.find_by_filter).mockResolvedValue(
        create_paginated_result(mock_teams),
      );

      const result = await use_cases.list(filter);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(mock_repository.find_by_filter).toHaveBeenCalledWith(
        filter,
        undefined,
      );
    });

    it("returns empty array with error message when repository fails", async () => {
      vi.mocked(mock_repository.find_all).mockResolvedValue({
        success: false,
        error: "Database connection failed",
      });

      const result = await use_cases.list();

      expect(result.success).toBe(false);
      expect(result.data).toEqual([]);
      expect(result.error_message).toBe("Database connection failed");
    });
  });

  describe("get_by_id", () => {
    it("returns team when found", async () => {
      const mock_team = create_mock_team({ id: "t1" });
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: mock_team,
      });

      const result = await use_cases.get_by_id("t1");

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe("t1");
      expect(mock_repository.find_by_id).toHaveBeenCalledWith("t1");
    });

    it("returns error when id is empty", async () => {
      const result = await use_cases.get_by_id("");

      expect(result.success).toBe(false);
      expect(result.error_message).toBe("Team ID is required");
      expect(mock_repository.find_by_id).not.toHaveBeenCalled();
    });

    it("returns error when id is whitespace only", async () => {
      const result = await use_cases.get_by_id("   ");

      expect(result.success).toBe(false);
      expect(result.error_message).toBe("Team ID is required");
    });
  });

  describe("create", () => {
    it("creates team with valid input", async () => {
      const input = create_valid_team_input();
      const created_team = create_mock_team({ ...input, id: "new_team" });
      vi.mocked(mock_repository.create).mockResolvedValue({
        success: true,
        data: created_team,
      });

      const result = await use_cases.create(input);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe("new_team");
      expect(mock_repository.create).toHaveBeenCalledWith(input);
    });

    it("returns validation error when name is too short", async () => {
      const input = create_valid_team_input({ name: "A" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      expect(result.error_message).toContain(
        "Team name must be at least 2 characters",
      );
      expect(mock_repository.create).not.toHaveBeenCalled();
    });

    it("returns validation error when name is missing", async () => {
      const input = create_valid_team_input({ name: "" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      expect(result.error_message).toContain(
        "Team name must be at least 2 characters",
      );
    });

    it("returns validation error when organization is missing", async () => {
      const input = create_valid_team_input({ organization_id: "" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      expect(result.error_message).toContain("Organization is required");
    });

    it("returns validation error when max squad size is less than 1", async () => {
      const input = create_valid_team_input({ max_squad_size: 0 });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      expect(result.error_message).toContain(
        "Maximum squad size must be at least 1",
      );
    });

    it("returns multiple validation errors when multiple fields are invalid", async () => {
      const input = create_valid_team_input({
        name: "",
        organization_id: "",
        max_squad_size: 0,
      });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      expect(result.error_message).toContain(
        "Team name must be at least 2 characters",
      );
      expect(result.error_message).toContain("Organization is required");
      expect(result.error_message).toContain(
        "Maximum squad size must be at least 1",
      );
    });

    it("returns error when repository fails", async () => {
      const input = create_valid_team_input();
      vi.mocked(mock_repository.create).mockResolvedValue({
        success: false,
        error: "Database error",
      });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      expect(result.error_message).toBe("Database error");
    });
  });

  describe("update", () => {
    it("updates team with valid input", async () => {
      const update_input: UpdateTeamInput = { name: "Updated Team Name" };
      const updated_team = create_mock_team({
        id: "t1",
        name: "Updated Team Name",
      });
      vi.mocked(mock_repository.update).mockResolvedValue({
        success: true,
        data: updated_team,
      });

      const result = await use_cases.update("t1", update_input);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe("Updated Team Name");
      expect(mock_repository.update).toHaveBeenCalledWith("t1", update_input);
    });

    it("returns error when id is empty", async () => {
      const result = await use_cases.update("", { name: "New Name" });

      expect(result.success).toBe(false);
      expect(result.error_message).toBe("Team ID is required");
      expect(mock_repository.update).not.toHaveBeenCalled();
    });

    it("returns error when id is whitespace only", async () => {
      const result = await use_cases.update("   ", { name: "New Name" });

      expect(result.success).toBe(false);
      expect(result.error_message).toBe("Team ID is required");
    });
  });

  describe("delete", () => {
    it("deletes team successfully", async () => {
      vi.mocked(mock_repository.delete_by_id).mockResolvedValue({
        success: true,
        data: true,
      });

      const result = await use_cases.delete("t1");

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      expect(mock_repository.delete_by_id).toHaveBeenCalledWith("t1");
    });

    it("returns error when id is empty", async () => {
      const result = await use_cases.delete("");

      expect(result.success).toBe(false);
      expect(result.error_message).toBe("Team ID is required");
      expect(mock_repository.delete_by_id).not.toHaveBeenCalled();
    });

    it("returns error when id is whitespace only", async () => {
      const result = await use_cases.delete("   ");

      expect(result.success).toBe(false);
      expect(result.error_message).toBe("Team ID is required");
    });
  });

  describe("delete_teams", () => {
    it("deletes multiple teams successfully", async () => {
      vi.mocked(mock_repository.delete_by_ids).mockResolvedValue({
        success: true,
        data: 3,
      });

      const result = await use_cases.delete_teams(["t1", "t2", "t3"]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(3);
      }
      expect(mock_repository.delete_by_ids).toHaveBeenCalledWith([
        "t1",
        "t2",
        "t3",
      ]);
    });

    it("returns error when ids array is empty", async () => {
      const result = await use_cases.delete_teams([]);

      expect(result.success).toBe(false);
      expect((result as any).error).toBe("At least one team ID is required");
      expect(mock_repository.delete_by_ids).not.toHaveBeenCalled();
    });
  });

  describe("list_teams_by_organization", () => {
    it("returns teams for an organization", async () => {
      const mock_teams = [
        create_mock_team({ id: "t1" }),
        create_mock_team({ id: "t2" }),
      ];
      vi.mocked(mock_repository.find_by_organization).mockResolvedValue(
        create_paginated_result(mock_teams),
      );

      const result = await use_cases.list_teams_by_organization("org_1");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items).toHaveLength(2);
      }
      expect(mock_repository.find_by_organization).toHaveBeenCalledWith(
        "org_1",
        undefined,
      );
    });

    it("returns error when organization id is empty", async () => {
      const result = await use_cases.list_teams_by_organization("");

      expect(result.success).toBe(false);
      expect((result as any).error).toBe("Organization ID is required");
      expect(mock_repository.find_by_organization).not.toHaveBeenCalled();
    });

    it("returns error when organization id is whitespace only", async () => {
      const result = await use_cases.list_teams_by_organization("   ");

      expect(result.success).toBe(false);
      expect((result as any).error).toBe("Organization ID is required");
    });

    it("passes query options to repository", async () => {
      const options: QueryOptions = { page_number: 1, page_size: 50 };
      vi.mocked(mock_repository.find_by_organization).mockResolvedValue(
        create_paginated_result([]),
      );

      await use_cases.list_teams_by_organization("org_1", options);

      expect(mock_repository.find_by_organization).toHaveBeenCalledWith(
        "org_1",
        options,
      );
    });
  });
});
