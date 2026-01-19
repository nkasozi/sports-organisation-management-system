import { describe, it, expect, vi, beforeEach } from "vitest";
import { create_fixture_lineup_use_cases } from "./FixtureLineupUseCases";
import type { FixtureLineupRepository } from "../interfaces/adapters/FixtureLineupRepository";
import type {
  FixtureLineup,
  CreateFixtureLineupInput,
} from "../entities/FixtureLineup";

function create_mock_repository(): FixtureLineupRepository {
  return {
    create_fixture_lineup: vi.fn(),
    get_fixture_lineup_by_id: vi.fn(),
    update_fixture_lineup: vi.fn(),
    delete_fixture_lineup: vi.fn(),
    find_by_filter: vi.fn(),
    find_by_fixture: vi.fn(),
    find_by_fixture_and_team: vi.fn(),
    get_lineups_for_fixture: vi.fn(),
    get_lineup_for_team_in_fixture: vi.fn(),
  };
}

function create_test_lineup(
  overrides: Partial<FixtureLineup> = {},
): FixtureLineup {
  return {
    id: "lineup-123",
    fixture_id: "fixture-123",
    team_id: "team-123",
    selected_player_ids: ["player-123"],
    status: "draft",
    submitted_by: "",
    submitted_at: "",
    notes: "",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

function create_valid_input(
  overrides: Partial<CreateFixtureLineupInput> = {},
): CreateFixtureLineupInput {
  return {
    fixture_id: "fixture-123",
    team_id: "team-123",
    selected_player_ids: ["player-456"],
    submitted_by: "coach-123",
    notes: "",
    ...overrides,
  };
}

describe("FixtureLineupUseCases", () => {
  let mock_repository: FixtureLineupRepository;
  let use_cases: ReturnType<typeof create_fixture_lineup_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_fixture_lineup_use_cases(mock_repository);
  });

  describe("list", () => {
    it("should return all lineups when no filter", async () => {
      const lineups = [
        create_test_lineup({ id: "1" }),
        create_test_lineup({ id: "2" }),
      ];
      vi.mocked(mock_repository.find_by_filter).mockResolvedValue({
        success: true,
        data: lineups,
        total_count: 2,
      });

      const result = await use_cases.list();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    it("should apply filter when provided", async () => {
      const filter = { fixture_id: "fixture-123" };
      vi.mocked(mock_repository.find_by_filter).mockResolvedValue({
        success: true,
        data: [create_test_lineup()],
        total_count: 1,
      });

      const result = await use_cases.list(filter);

      expect(mock_repository.find_by_filter).toHaveBeenCalledWith(
        filter,
        undefined,
      );
    });
  });

  describe("get_by_id", () => {
    it("should return lineup when found", async () => {
      vi.mocked(mock_repository.get_fixture_lineup_by_id).mockResolvedValue({
        success: true,
        data: create_test_lineup(),
      });

      const result = await use_cases.get_by_id("lineup-123");

      expect(result.success).toBe(true);
      expect(result.data?.selected_player_ids).toContain("player-123");
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.get_by_id("");

      expect(result.success).toBe(false);
      expect(result.error_message).toBe("FixtureLineup ID is required");
    });
  });

  describe("create", () => {
    it("should create with valid input", async () => {
      const input = create_valid_input();
      vi.mocked(
        mock_repository.get_lineup_for_team_in_fixture,
      ).mockResolvedValue({
        success: false,
        error_message: "Not found",
      });
      vi.mocked(mock_repository.create_fixture_lineup).mockResolvedValue({
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
      vi.mocked(mock_repository.get_fixture_lineup_by_id).mockResolvedValue({
        success: true,
        data: create_test_lineup({ status: "draft" }),
      });
      vi.mocked(mock_repository.update_fixture_lineup).mockResolvedValue({
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
      expect(result.error_message).toBe("FixtureLineup ID is required");
    });

    it("should fail when trying to change fixture_id", async () => {
      vi.mocked(mock_repository.get_fixture_lineup_by_id).mockResolvedValue({
        success: true,
        data: create_test_lineup({
          fixture_id: "fixture-123",
          status: "draft",
        }),
      });

      const result = await use_cases.update("lineup-123", {
        fixture_id: "fixture-different",
      });

      expect(result.success).toBe(false);
      expect(result.error_message).toBe(
        "Cannot change fixture for an existing lineup. Please create a new lineup instead.",
      );
    });

    it("should fail when trying to change team_id", async () => {
      vi.mocked(mock_repository.get_fixture_lineup_by_id).mockResolvedValue({
        success: true,
        data: create_test_lineup({ team_id: "team-123", status: "draft" }),
      });

      const result = await use_cases.update("lineup-123", {
        team_id: "team-different",
      });

      expect(result.success).toBe(false);
      expect(result.error_message).toBe(
        "Cannot change team for an existing lineup. Please create a new lineup instead.",
      );
    });
  });

  describe("delete", () => {
    it("should delete by id", async () => {
      vi.mocked(mock_repository.get_fixture_lineup_by_id).mockResolvedValue({
        success: true,
        data: create_test_lineup({ status: "draft" }),
      });
      vi.mocked(mock_repository.delete_fixture_lineup).mockResolvedValue({
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
        data: [create_test_lineup()],
        total_count: 1,
      });

      const result = await use_cases.list_lineups_by_fixture("fixture-123");

      expect(result.success).toBe(true);
      expect(mock_repository.find_by_fixture).toHaveBeenCalledWith(
        "fixture-123",
        undefined,
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
        data: [create_test_lineup()],
        total_count: 1,
      });

      const result = await use_cases.list_lineups_by_fixture_and_team(
        "fixture-123",
        "team-123",
      );

      expect(result.success).toBe(true);
      expect(mock_repository.find_by_fixture_and_team).toHaveBeenCalledWith(
        "fixture-123",
        "team-123",
        undefined,
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
