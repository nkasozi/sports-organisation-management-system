import { beforeEach, describe, expect, it, vi } from "vitest";

import type { FixtureLineupRepository } from "../interfaces/ports";
import { create_fixture_lineup_use_cases } from "./FixtureLineupUseCases";
import {
  create_mock_repository,
  create_test_lineup,
} from "./FixtureLineupUseCases.test_support";

describe("FixtureLineupUseCases", () => {
  let mock_repository: FixtureLineupRepository;
  let use_cases: ReturnType<typeof create_fixture_lineup_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_fixture_lineup_use_cases(mock_repository);
  });

  describe("delete", () => {
    it("should delete by id", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: create_test_lineup({ status: "draft" }),
      });
      vi.mocked(mock_repository.delete_by_id).mockResolvedValue({
        success: true,
        data: true,
      });

      const result = await use_cases.delete("lineup-123");

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.delete("");

      expect(result.success).toBe(false);
    });
  });

  describe("list_lineups_by_fixture", () => {
    it("should return lineups for fixture", async () => {
      vi.mocked(mock_repository.find_by_fixture).mockResolvedValue({
        success: true,
        data: {
          items: [create_test_lineup()],
          total_count: 1,
          page_number: 1,
          page_size: 10,
          total_pages: 1,
        },
      });

      const result = await use_cases.list_lineups_by_fixture("fixture-123");

      expect(result.success).toBe(true);
      expect(mock_repository.find_by_fixture).toHaveBeenCalledWith(
        "fixture-123",
        void 0,
      );
    });

    it("should fail for empty fixture_id", async () => {
      const result = await use_cases.list_lineups_by_fixture("");

      expect(result.success).toBe(false);
    });
  });

  describe("list_lineups_by_fixture_and_team", () => {
    it("should return lineups for fixture and team", async () => {
      vi.mocked(mock_repository.find_by_fixture_and_team).mockResolvedValue({
        success: true,
        data: {
          items: [create_test_lineup()],
          total_count: 1,
          page_number: 1,
          page_size: 10,
          total_pages: 1,
        },
      });

      const result = await use_cases.list_lineups_by_fixture_and_team(
        "fixture-123",
        "team-123",
      );

      expect(result.success).toBe(true);
      expect(mock_repository.find_by_fixture_and_team).toHaveBeenCalledWith(
        "fixture-123",
        "team-123",
        void 0,
      );
    });

    it("should fail for empty fixture_id", async () => {
      const result = await use_cases.list_lineups_by_fixture_and_team(
        "",
        "team-123",
      );

      expect(result.success).toBe(false);
    });

    it("should fail for empty team_id", async () => {
      const result = await use_cases.list_lineups_by_fixture_and_team(
        "fixture-123",
        "",
      );

      expect(result.success).toBe(false);
    });
  });
});
