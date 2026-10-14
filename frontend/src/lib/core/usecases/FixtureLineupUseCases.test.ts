import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LineupPlayer } from "../entities/FixtureLineup";
import type { FixtureLineupRepository } from "../interfaces/ports";
import { create_fixture_lineup_use_cases } from "./FixtureLineupUseCases";
import {
  create_fixture_repository_with_status,
  create_mock_repository,
  create_test_lineup,
  create_valid_input,
} from "./FixtureLineupUseCases.test_support";

describe("FixtureLineupUseCases", () => {
  let mock_repository: FixtureLineupRepository;
  let use_cases: ReturnType<typeof create_fixture_lineup_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_fixture_lineup_use_cases(
      mock_repository,
      create_fixture_repository_with_status("scheduled"),
    );
  });

  describe("list", () => {
    it("should return all lineups when no filter", async () => {
      const lineups = [
        create_test_lineup({ id: "1" }),
        create_test_lineup({ id: "2" }),
      ];
      vi.mocked(mock_repository.find_all).mockResolvedValue({
        success: true,
        data: {
          items: lineups,
          total_count: 2,
          page_number: 1,
          page_size: 50,
          total_pages: 1,
        },
      });

      const result = await use_cases.list();

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.items).toHaveLength(2);
    });

    it("should apply filter when provided", async () => {
      const filter = { fixture_id: "fixture-123" };
      vi.mocked(mock_repository.find_all).mockResolvedValue({
        success: true,
        data: {
          items: [create_test_lineup()],
          total_count: 1,
          page_number: 1,
          page_size: 50,
          total_pages: 1,
        },
      });

      const result = await use_cases.list(filter);

      expect(mock_repository.find_all).toHaveBeenCalledWith(filter, {});
    });
  });

  describe("get_by_id", () => {
    it("should return lineup when found", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: create_test_lineup(),
      });

      const result = await use_cases.get_by_id("lineup-123");

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(
        result.data?.selected_players.some(
          (p: LineupPlayer) => p.id === "player-123",
        ),
      ).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.get_by_id("");

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("FixtureLineup ID is required");
    });
  });

  describe("create", () => {
    it("should create with valid input", async () => {
      const input = create_valid_input();
      vi.mocked(
        mock_repository.get_lineup_for_team_in_fixture,
      ).mockResolvedValue({
        success: false,
        error: "Not found",
      });
      vi.mocked(mock_repository.create).mockResolvedValue({
        success: true,
        data: create_test_lineup(),
      });

      const result = await use_cases.create(input);

      expect(result.success).toBe(true);
    });

    it("should fail for missing fixture_id", async () => {
      const input = create_valid_input({ fixture_id: "" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
    });

    it("should fail for missing team_id", async () => {
      const input = create_valid_input({ team_id: "" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
    });
  });

  describe("update", () => {
    it("should update with valid input", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: create_test_lineup({ status: "draft" }),
      });
      vi.mocked(mock_repository.update).mockResolvedValue({
        success: true,
        data: create_test_lineup({ status: "submitted" }),
      });

      const result = await use_cases.update("lineup-123", {
        status: "submitted",
      });

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.update("", { status: "submitted" });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("FixtureLineup ID is required");
    });
  });
});
