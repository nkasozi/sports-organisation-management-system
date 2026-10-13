import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PlayerFilter, QueryOptions } from "../interfaces/ports";
import type { PlayerRepository } from "../interfaces/ports";
import {
  USE_CASE_ERROR_MESSAGES,
  UseCaseErrorCode,
} from "../types/UseCaseFailure";
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
      if (!result.success) return;
      expect(result.data.items).toHaveLength(2);
      expect(result.data.total_count).toBe(2);
      expect(mock_repository.find_all).toHaveBeenCalledOnce();
    });

    it("returns filtered players when filter provided", async () => {
      const mock_players = [create_mock_player({ id: "p1", status: "active" })];
      const filter = { status: "active" } as PlayerFilter;
      vi.mocked(mock_repository.find_all).mockResolvedValue(
        create_paginated_result(mock_players),
      );

      const result = await use_cases.list(filter);

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.items).toHaveLength(1);
      expect(mock_repository.find_all).toHaveBeenCalledWith(filter, {});
    });

    it("returns empty array with error message when repository fails", async () => {
      vi.mocked(mock_repository.find_all).mockResolvedValue({
        success: false,
        error: "Database connection failed",
      });

      const result = await use_cases.list();

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe(
        USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.DEPENDENCY_FAILED],
      );
    });

    it("passes query options to repository", async () => {
      const options = { page_number: 2, page_size: 20 } as QueryOptions;
      vi.mocked(mock_repository.find_all).mockResolvedValue(
        create_paginated_result([]),
      );

      const result = await use_cases.list({}, options);

      expect(result.success).toBe(true);

      expect(mock_repository.find_all).toHaveBeenCalledWith({}, options);
    });

    it("passes team_id filter to repository for team manager scoping", async () => {
      const team_players = [
        create_mock_player({ id: "p1" }),
        create_mock_player({ id: "p2" }),
      ];
      const filter = { team_id: "team_123" } as PlayerFilter;
      vi.mocked(mock_repository.find_all).mockResolvedValue(
        create_paginated_result(team_players),
      );

      const result = await use_cases.list(filter);

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.items).toHaveLength(2);
      expect(mock_repository.find_all).toHaveBeenCalledWith(
        { team_id: "team_123" },
        {},
      );
    });

    it("passes combined team_id and organization_id filter to repository", async () => {
      const filter = {
        team_id: "team_456",
        status: "active",
      } as PlayerFilter;
      vi.mocked(mock_repository.find_all).mockResolvedValue(
        create_paginated_result([create_mock_player({ id: "p1" })]),
      );

      const result = await use_cases.list(filter);

      expect(result.success).toBe(true);
      expect(mock_repository.find_all).toHaveBeenCalledWith(filter, {});
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
      if (!result.success) return;
      expect(result.data?.id).toBe("p1");
      expect(mock_repository.find_by_id).toHaveBeenCalledWith("p1");
    });

    it("returns error when id is empty", async () => {
      const result = await use_cases.get_by_id("");

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Player ID is required");
      expect(mock_repository.find_by_id).not.toHaveBeenCalled();
    });

    it("returns error when id is whitespace only", async () => {
      const result = await use_cases.get_by_id("   ");

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Player ID is required");
    });

    it("returns error when repository fails", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: false,
        error: "Player not found",
      });

      const result = await use_cases.get_by_id("nonexistent");

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe(
        USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.NOT_FOUND],
      );
    });
  });
});
