import { beforeEach, describe, expect, it, vi } from "vitest";

import type { FixtureRepository } from "../interfaces/ports";
import { create_fixture_use_cases } from "./FixtureUseCases";
import {
  create_mock_repository,
  create_test_fixture,
} from "./FixtureUseCases.test_support";

describe("FixtureUseCases", () => {
  let mock_repository: FixtureRepository;
  let use_cases: ReturnType<typeof create_fixture_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_fixture_use_cases(mock_repository);
  });

  describe("list_fixtures_by_team", () => {
    it("should return fixtures for team", async () => {
      vi.mocked(mock_repository.find_by_team).mockResolvedValue({
        success: true,
        data: {
          items: [create_test_fixture()],
          total_count: 1,
          page_number: 1,
          page_size: 10,
          total_pages: 1,
        },
      });

      const result = await use_cases.list_fixtures_by_team("team-1");

      expect(result.success).toBe(true);
    });

    it("should fail for empty team_id", async () => {
      const result = await use_cases.list_fixtures_by_team("");

      expect(result.success).toBe(false);
    });
  });

  describe("list_fixtures_by_round", () => {
    it("should return fixtures for round", async () => {
      vi.mocked(mock_repository.find_by_round).mockResolvedValue({
        success: true,
        data: {
          items: [create_test_fixture()],
          total_count: 1,
          page_number: 1,
          page_size: 10,
          total_pages: 1,
        },
      });

      const result = await use_cases.list_fixtures_by_round("comp-123", 1);

      expect(result.success).toBe(true);
    });

    it("should fail for empty competition_id", async () => {
      const result = await use_cases.list_fixtures_by_round("", 1);

      expect(result.success).toBe(false);
    });

    it("should fail for round less than 1", async () => {
      const result = await use_cases.list_fixtures_by_round("comp-123", 0);

      expect(result.success).toBe(false);
    });
  });

  describe("generate_fixtures", () => {
    it("should generate fixtures with valid config", async () => {
      vi.mocked(mock_repository.create_many).mockResolvedValue({
        success: true,
        data: {
          items: [create_test_fixture()],
          total_count: 1,
          page_number: 1,
          page_size: 10,
          total_pages: 1,
        },
      });

      const result = await use_cases.generate_fixtures({
        organization_id: "org-123",
        competition_id: "comp-123",
        team_ids: ["team-1", "team-2", "team-3", "team-4"],
        start_date: "2024-06-01",
        match_days_per_week: [0, 3, 6],
        default_time: "15:00",
        venue_rotation: "home_away",
        rounds: 1,
        stage_id_per_round: { 1: "stage-1" },
      });

      expect(result.success).toBe(true);
    });

    it("should fail for missing competition_id", async () => {
      const result = await use_cases.generate_fixtures({
        organization_id: "org-123",
        competition_id: "",
        team_ids: ["team-1", "team-2"],
        start_date: "2024-06-01",
        match_days_per_week: [0, 3, 6],
        default_time: "15:00",
        venue_rotation: "home_away",
        rounds: 1,
        stage_id_per_round: {},
      });

      expect(result.success).toBe(false);
    });

    it("should fail for less than 2 teams", async () => {
      const result = await use_cases.generate_fixtures({
        organization_id: "org-123",
        competition_id: "comp-123",
        team_ids: ["team-1"],
        start_date: "2024-06-01",
        match_days_per_week: [0, 3, 6],
        default_time: "15:00",
        venue_rotation: "home_away",
        rounds: 1,
        stage_id_per_round: {},
      });

      expect(result.success).toBe(false);
    });

    it("should fail for missing start_date", async () => {
      const result = await use_cases.generate_fixtures({
        organization_id: "org-123",
        competition_id: "comp-123",
        team_ids: ["team-1", "team-2"],
        start_date: "",
        match_days_per_week: [0, 3, 6],
        default_time: "15:00",
        venue_rotation: "home_away",
        rounds: 1,
        stage_id_per_round: {},
      });

      expect(result.success).toBe(false);
    });
  });
});
