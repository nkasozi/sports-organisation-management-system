import { beforeEach, describe, expect, it, vi } from "vitest";

import type { FixtureRepository } from "../interfaces/ports";
import { create_fixture_use_cases } from "./FixtureUseCases";
import {
  create_mock_repository,
  create_test_fixture,
  create_valid_input,
} from "./FixtureUseCases.test_support";

describe("FixtureUseCases", () => {
  let mock_repository: FixtureRepository;
  let use_cases: ReturnType<typeof create_fixture_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_fixture_use_cases(mock_repository);
  });

  describe("list", () => {
    it("should return all fixtures when no filter", async () => {
      const fixtures = [
        create_test_fixture({ id: "1" }),
        create_test_fixture({ id: "2" }),
      ];
      vi.mocked(mock_repository.find_all).mockResolvedValue({
        success: true,
        data: {
          items: fixtures,
          total_count: 2,
          page_number: 1,
          page_size: 10,
          total_pages: 1,
        },
      });

      const result = await use_cases.list();

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.items).toHaveLength(2);
      expect(result.data.total_count).toBe(2);
    });

    it("should apply filter when provided", async () => {
      const filter = { competition_id: "comp-123" };
      vi.mocked(mock_repository.find_all).mockResolvedValue({
        success: true,
        data: {
          items: [create_test_fixture()],
          total_count: 1,
          page_number: 1,
          page_size: 10,
          total_pages: 1,
        },
      });

      const result = await use_cases.list(filter);

      expect(mock_repository.find_all).toHaveBeenCalledWith(filter, {});
    });
  });

  describe("get_by_id", () => {
    it("should return fixture when found", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: create_test_fixture(),
      });

      const result = await use_cases.get_by_id("fixture-123");

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.get_by_id("");

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Fixture ID is required");
    });
  });

  describe("create", () => {
    it("should create with valid input", async () => {
      const input = create_valid_input();
      vi.mocked(mock_repository.create).mockResolvedValue({
        success: true,
        data: create_test_fixture(),
      });

      const result = await use_cases.create(input);

      expect(result.success).toBe(true);
    });

    it("should fail for missing competition_id", async () => {
      const input = create_valid_input({ competition_id: "" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
    });

    it("should fail when home and away team are same", async () => {
      const input = create_valid_input({
        home_team_id: "team-1",
        away_team_id: "team-1",
      });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
    });

    it("should fail for missing stage_id", async () => {
      const input = create_valid_input({ stage_id: "" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
    });
  });

  describe("list_fixtures_by_competition", () => {
    it("should return fixtures for competition", async () => {
      vi.mocked(mock_repository.find_by_competition).mockResolvedValue({
        success: true,
        data: {
          items: [create_test_fixture()],
          total_count: 1,
          page_number: 1,
          page_size: 10,
          total_pages: 1,
        },
      });

      const result = await use_cases.list_fixtures_by_competition("comp-123");

      expect(result.success).toBe(true);
      expect(mock_repository.find_by_competition).toHaveBeenCalledWith(
        "comp-123",
        void 0,
      );
    });

    it("should fail for empty competition_id", async () => {
      const result = await use_cases.list_fixtures_by_competition("");

      expect(result.success).toBe(false);
    });
  });
});
