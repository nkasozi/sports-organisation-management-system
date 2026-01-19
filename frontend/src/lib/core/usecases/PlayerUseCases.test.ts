import { describe, it, expect, beforeEach, vi } from "vitest";
import type {
  PlayerRepository,
  PlayerFilter,
} from "../interfaces/adapters/PlayerRepository";
import type { QueryOptions } from "../interfaces/adapters/Repository";
import type {
  Player,
  CreatePlayerInput,
  UpdatePlayerInput,
} from "../entities/Player";
import type { Result, PaginatedResult } from "../types/Result";
import { create_player_use_cases } from "./PlayerUseCases";

function create_mock_player(overrides: Partial<Player> = {}): Player {
  return {
    id: "player_1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    first_name: "John",
    last_name: "Doe",
    email: "john.doe@example.com",
    phone: "+1234567890",
    date_of_birth: "1990-01-01",
    position_id: "position_1",
    height_cm: 180,
    weight_kg: 75,
    nationality: "Uganda",
    profile_image_url: "",
    emergency_contact_name: "Jane Doe",
    emergency_contact_phone: "+0987654321",
    medical_notes: "",
    status: "active",
    ...overrides,
  };
}

function create_valid_player_input(
  overrides: Partial<CreatePlayerInput> = {},
): CreatePlayerInput {
  return {
    first_name: "John",
    last_name: "Doe",
    email: "john.doe@example.com",
    phone: "+1234567890",
    date_of_birth: "1990-01-01",
    position_id: "position_1",
    height_cm: 180,
    weight_kg: 75,
    nationality: "Uganda",
    profile_image_url: "",
    emergency_contact_name: "Jane Doe",
    emergency_contact_phone: "+0987654321",
    medical_notes: "",
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

function create_mock_repository(): PlayerRepository {
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
    find_by_team: vi.fn(),
    find_active_players: vi.fn(),
    find_by_jersey_number: vi.fn(),
  };
}

describe("PlayerUseCases", () => {
  let mock_repository: PlayerRepository;
  let use_cases: ReturnType<typeof create_player_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_player_use_cases(mock_repository);
  });

  describe("list", () => {
    it("returns all players when no filter provided", async () => {
      const mock_players = [
        create_mock_player({ id: "p1" }),
        create_mock_player({ id: "p2" }),
      ];
      vi.mocked(mock_repository.find_all).mockResolvedValue(
        create_paginated_result(mock_players),
      );

      const result = await use_cases.list();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.total_count).toBe(2);
      expect(mock_repository.find_all).toHaveBeenCalledOnce();
    });

    it("returns filtered players when filter provided", async () => {
      const mock_players = [create_mock_player({ id: "p1", status: "active" })];
      const filter: PlayerFilter = { status: "active" };
      vi.mocked(mock_repository.find_by_filter).mockResolvedValue(
        create_paginated_result(mock_players),
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

    it("passes query options to repository", async () => {
      const options: QueryOptions = { page_number: 2, page_size: 20 };
      vi.mocked(mock_repository.find_all).mockResolvedValue(
        create_paginated_result([]),
      );

      await use_cases.list(undefined, options);

      expect(mock_repository.find_all).toHaveBeenCalledWith(options);
    });
  });

  describe("get_by_id", () => {
    it("returns player when found", async () => {
      const mock_player = create_mock_player({ id: "p1" });
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: mock_player,
      });

      const result = await use_cases.get_by_id("p1");

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe("p1");
      expect(mock_repository.find_by_id).toHaveBeenCalledWith("p1");
    });

    it("returns error when id is empty", async () => {
      const result = await use_cases.get_by_id("");

      expect(result.success).toBe(false);
      expect(result.error_message).toBe("Player ID is required");
      expect(mock_repository.find_by_id).not.toHaveBeenCalled();
    });

    it("returns error when id is whitespace only", async () => {
      const result = await use_cases.get_by_id("   ");

      expect(result.success).toBe(false);
      expect(result.error_message).toBe("Player ID is required");
    });

    it("returns error when repository fails", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: false,
        error: "Player not found",
      });

      const result = await use_cases.get_by_id("nonexistent");

      expect(result.success).toBe(false);
      expect(result.error_message).toBe("Player not found");
    });
  });

  describe("create", () => {
    it("creates player with valid input", async () => {
      const input = create_valid_player_input();
      const created_player = create_mock_player({ ...input, id: "new_player" });
      vi.mocked(mock_repository.create).mockResolvedValue({
        success: true,
        data: created_player,
      });

      const result = await use_cases.create(input);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe("new_player");
      expect(mock_repository.create).toHaveBeenCalledWith(input);
    });

    it("returns validation error when first name is missing", async () => {
      const input = create_valid_player_input({ first_name: "" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      expect(result.error_message).toContain("First name is required");
      expect(mock_repository.create).not.toHaveBeenCalled();
    });

    it("returns validation error when last name is missing", async () => {
      const input = create_valid_player_input({ last_name: "" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      expect(result.error_message).toContain("Last name is required");
    });

    it("returns validation error when date of birth is missing", async () => {
      const input = create_valid_player_input({ date_of_birth: "" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      expect(result.error_message).toContain("Date of birth is required");
    });

    it("returns validation error when nationality is missing", async () => {
      const input = create_valid_player_input({ nationality: "" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      expect(result.error_message).toContain("Nationality is required");
    });

    it("returns validation error when position is missing", async () => {
      const input = create_valid_player_input({ position_id: "" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      expect(result.error_message).toContain("Position is required");
    });

    it("returns multiple validation errors when multiple fields are invalid", async () => {
      const input = create_valid_player_input({
        first_name: "",
        last_name: "",
        date_of_birth: "",
      });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      expect(result.error_message).toContain("First name is required");
      expect(result.error_message).toContain("Last name is required");
      expect(result.error_message).toContain("Date of birth is required");
    });

    it("returns error when repository fails", async () => {
      const input = create_valid_player_input();
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
    it("updates player with valid input", async () => {
      const update_input: UpdatePlayerInput = { first_name: "Jane" };
      const updated_player = create_mock_player({
        id: "p1",
        first_name: "Jane",
      });
      vi.mocked(mock_repository.update).mockResolvedValue({
        success: true,
        data: updated_player,
      });

      const result = await use_cases.update("p1", update_input);

      expect(result.success).toBe(true);
      expect(result.data?.first_name).toBe("Jane");
      expect(mock_repository.update).toHaveBeenCalledWith("p1", update_input);
    });

    it("returns error when id is empty", async () => {
      const result = await use_cases.update("", { first_name: "Jane" });

      expect(result.success).toBe(false);
      expect(result.error_message).toBe("Player ID is required");
      expect(mock_repository.update).not.toHaveBeenCalled();
    });

    it("returns error when id is whitespace only", async () => {
      const result = await use_cases.update("   ", { first_name: "Jane" });

      expect(result.success).toBe(false);
      expect(result.error_message).toBe("Player ID is required");
    });

    it("returns error when repository fails", async () => {
      vi.mocked(mock_repository.update).mockResolvedValue({
        success: false,
        error: "Player not found",
      });

      const result = await use_cases.update("nonexistent", {
        first_name: "Jane",
      });

      expect(result.success).toBe(false);
      expect(result.error_message).toBe("Player not found");
    });
  });

  describe("delete", () => {
    it("deletes player successfully", async () => {
      vi.mocked(mock_repository.delete_by_id).mockResolvedValue({
        success: true,
        data: true,
      });

      const result = await use_cases.delete("p1");

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      expect(mock_repository.delete_by_id).toHaveBeenCalledWith("p1");
    });

    it("returns error when id is empty", async () => {
      const result = await use_cases.delete("");

      expect(result.success).toBe(false);
      expect(result.error_message).toBe("Player ID is required");
      expect(mock_repository.delete_by_id).not.toHaveBeenCalled();
    });

    it("returns error when id is whitespace only", async () => {
      const result = await use_cases.delete("   ");

      expect(result.success).toBe(false);
      expect(result.error_message).toBe("Player ID is required");
    });

    it("returns error when repository fails", async () => {
      vi.mocked(mock_repository.delete_by_id).mockResolvedValue({
        success: false,
        error: "Cannot delete player with active memberships",
      });

      const result = await use_cases.delete("p1");

      expect(result.success).toBe(false);
      expect(result.error_message).toBe(
        "Cannot delete player with active memberships",
      );
    });
  });

  describe("delete_players", () => {
    it("deletes multiple players successfully", async () => {
      vi.mocked(mock_repository.delete_by_ids).mockResolvedValue({
        success: true,
        data: 3,
      });

      const result = await use_cases.delete_players(["p1", "p2", "p3"]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(3);
      }
      expect(mock_repository.delete_by_ids).toHaveBeenCalledWith([
        "p1",
        "p2",
        "p3",
      ]);
    });

    it("returns error when ids array is empty", async () => {
      const result = await use_cases.delete_players([]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("At least one player ID is required");
      }
      expect(mock_repository.delete_by_ids).not.toHaveBeenCalled();
    });

    it("returns error when ids is undefined", async () => {
      const result = await use_cases.delete_players(
        undefined as unknown as string[],
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("At least one player ID is required");
      }
    });
  });

  describe("list_players_by_team", () => {
    it("returns players for a team", async () => {
      const mock_players = [
        create_mock_player({ id: "p1" }),
        create_mock_player({ id: "p2" }),
      ];
      vi.mocked(mock_repository.find_by_team).mockResolvedValue(
        create_paginated_result(mock_players),
      );

      const result = await use_cases.list_players_by_team("team_1");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.items).toHaveLength(2);
      }
      expect(mock_repository.find_by_team).toHaveBeenCalledWith(
        "team_1",
        undefined,
      );
    });

    it("returns error when team id is empty", async () => {
      const result = await use_cases.list_players_by_team("");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Team ID is required");
      }
      expect(mock_repository.find_by_team).not.toHaveBeenCalled();
    });

    it("returns error when team id is whitespace only", async () => {
      const result = await use_cases.list_players_by_team("   ");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Team ID is required");
      }
    });

    it("passes query options to repository", async () => {
      const options: QueryOptions = { page_number: 1, page_size: 50 };
      vi.mocked(mock_repository.find_by_team).mockResolvedValue(
        create_paginated_result([]),
      );

      await use_cases.list_players_by_team("team_1", options);

      expect(mock_repository.find_by_team).toHaveBeenCalledWith(
        "team_1",
        options,
      );
    });
  });
});
