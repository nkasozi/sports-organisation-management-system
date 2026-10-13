import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CompetitionRepository } from "../interfaces/ports";
import {
  type CompetitionStageLifecyclePort,
  create_competition_use_cases_with_stage_lifecycle,
} from "./CompetitionUseCases";
import {
  create_mock_repository,
  create_mock_stage_lifecycle,
  create_test_competition,
  create_valid_input,
} from "./CompetitionUseCases.test_support";

describe("CompetitionUseCases", () => {
  let mock_repository: CompetitionRepository;
  let mock_stage_lifecycle: CompetitionStageLifecyclePort;
  let use_cases: ReturnType<
    typeof create_competition_use_cases_with_stage_lifecycle
  >;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    mock_stage_lifecycle = create_mock_stage_lifecycle();
    use_cases = create_competition_use_cases_with_stage_lifecycle(
      mock_repository,
      mock_stage_lifecycle,
    );
  });

  describe("list", () => {
    it("should return all competitions when no filter", async () => {
      const competitions = [
        create_test_competition({ id: "1" }),
        create_test_competition({ id: "2" }),
      ];
      vi.mocked(mock_repository.find_all).mockResolvedValue({
        success: true,
        data: {
          items: competitions,
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
      const filter = { organization_id: "org-123" };
      vi.mocked(mock_repository.find_all).mockResolvedValue({
        success: true,
        data: {
          items: [create_test_competition()],
          total_count: 1,
          page_number: 1,
          page_size: 10,
          total_pages: 1,
        },
      });

      const result = await use_cases.list(filter);

      expect(mock_repository.find_all).toHaveBeenCalledWith(filter, {});
      expect(result.success).toBe(true);
    });

    it("should return failure when repository fails", async () => {
      vi.mocked(mock_repository.find_all).mockResolvedValue({
        success: false,
        error: "Database error",
      });

      const result = await use_cases.list();

      expect(result.success).toBe(false);
    });
  });

  describe("get_by_id", () => {
    it("should return competition when found", async () => {
      const competition = create_test_competition();
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: competition,
      });

      const result = await use_cases.get_by_id("comp-123");

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data?.name).toBe("Test League");
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.get_by_id("");

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Competition ID is required");
    });
  });

  describe("create", () => {
    it("should create with valid input", async () => {
      const input = create_valid_input();
      const created = create_test_competition({ name: input.name });
      vi.mocked(mock_repository.create).mockResolvedValue({
        success: true,
        data: created,
      });

      const result = await use_cases.create(input);

      expect(result.success).toBe(true);
      expect(
        mock_stage_lifecycle.ensure_stages_for_competition,
      ).toHaveBeenCalledWith("comp-123", "format-123");
    });

    it("should roll back the competition when stage initialization fails", async () => {
      const input = create_valid_input();
      const created = create_test_competition({ name: input.name });
      vi.mocked(mock_repository.create).mockResolvedValue({
        success: true,
        data: created,
      });
      vi.mocked(mock_repository.delete_by_id).mockResolvedValue({
        success: true,
        data: true,
      });
      vi.mocked(
        mock_stage_lifecycle.ensure_stages_for_competition,
      ).mockResolvedValue({
        success: false,
        error: "Stage setup failed",
      });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      expect(mock_repository.delete_by_id).toHaveBeenCalledWith("comp-123");
    });

    it("should fail for empty name", async () => {
      const input = create_valid_input({ name: "" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
    });

    it("should fail for missing organization_id", async () => {
      const input = create_valid_input({ organization_id: "" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
    });
  });
});
