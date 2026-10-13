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

  describe("update", () => {
    it("should update with valid input", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: create_test_competition(),
      });
      vi.mocked(mock_repository.update).mockResolvedValue({
        success: true,
        data: create_test_competition({ name: "Updated" }),
      });

      const result = await use_cases.update("comp-123", { name: "Updated" });

      expect(result.success).toBe(true);
      expect(
        mock_stage_lifecycle.ensure_stages_for_competition,
      ).toHaveBeenCalledWith("comp-123", "format-123");
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.update("", { name: "Updated" });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Competition ID is required");
    });

    it("should replace stages when the competition format changes", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: create_test_competition({ competition_format_id: "format-old" }),
      });
      vi.mocked(mock_repository.update).mockResolvedValue({
        success: true,
        data: create_test_competition({ competition_format_id: "format-new" }),
      });

      const result = await use_cases.update("comp-123", {
        competition_format_id: "format-new",
      });

      expect(result.success).toBe(true);
      expect(
        mock_stage_lifecycle.can_replace_stages_for_competition,
      ).toHaveBeenCalledWith("comp-123");
      expect(
        mock_stage_lifecycle.replace_stages_for_competition,
      ).toHaveBeenCalledWith("comp-123", "format-new");
    });
  });

  describe("delete", () => {
    it("should delete by id", async () => {
      vi.mocked(mock_repository.delete_by_id).mockResolvedValue({
        success: true,
        data: true,
      });

      const result = await use_cases.delete("comp-123");

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.delete("");

      expect(result.success).toBe(false);
    });
  });

  describe("delete_competitions", () => {
    it("should delete multiple", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: create_test_competition(),
      });
      vi.mocked(mock_repository.delete_by_ids).mockResolvedValue({
        success: true,
        data: 2,
      });

      const result = await use_cases.delete_competitions(["1", "2"]);

      expect(result.success).toBe(true);
    });

    it("should fail for empty array", async () => {
      const result = await use_cases.delete_competitions([]);

      expect(result.success).toBe(false);
    });
  });

  describe("list_competitions_by_organization", () => {
    it("should return competitions for organization", async () => {
      vi.mocked(mock_repository.find_by_organization).mockResolvedValue({
        success: true,
        data: {
          items: [create_test_competition()],
          total_count: 1,
          page_number: 1,
          page_size: 10,
          total_pages: 1,
        },
      });

      const result =
        await use_cases.list_competitions_by_organization("org-123");

      expect(result.success).toBe(true);
      expect(mock_repository.find_by_organization).toHaveBeenCalledWith(
        "org-123",
        {},
      );
    });

    it("should fail for empty organization_id", async () => {
      const result = await use_cases.list_competitions_by_organization("");

      expect(result.success).toBe(false);
    });
  });
});
