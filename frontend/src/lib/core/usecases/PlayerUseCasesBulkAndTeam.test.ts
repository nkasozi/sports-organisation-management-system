import { beforeEach, describe, expect, it, vi } from "vitest";

import type { QueryOptions } from "../interfaces/ports";
import type { PlayerRepository } from "../interfaces/ports";
import { create_player_use_cases } from "./PlayerUseCases";
import {
  create_mock_player,
  create_mock_repository,
  create_paginated_result,
} from "./PlayerUseCases.test_support";

describe("PlayerUseCases", () => {
  let mock_repository: PlayerRepository;
  let use_cases: ReturnType<typeof create_player_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_player_use_cases(mock_repository);
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

    it("returns error when ids array is missing", async () => {
      const result = await use_cases.delete_players([] as unknown as string[]);

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
      expect(mock_repository.find_by_team).toHaveBeenCalledWith("team_1", {});
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
      const options = { page_number: 1, page_size: 50 } as QueryOptions;
      vi.mocked(mock_repository.find_by_team).mockResolvedValue(
        create_paginated_result([]),
      );

      const result = await use_cases.list_players_by_team("team_1", options);

      expect(result.success).toBe(true);

      expect(mock_repository.find_by_team).toHaveBeenCalledWith(
        "team_1",
        options,
      );
    });
  });
});
