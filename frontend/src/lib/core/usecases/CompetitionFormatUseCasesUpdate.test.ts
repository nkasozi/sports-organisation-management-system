import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CompetitionFormatRepository } from "../interfaces/ports";
import { build_competition_format_not_found_by_code_error } from "../interfaces/ports";
import { create_failure_result } from "../types/Result";
import { create_competition_format_use_cases } from "./CompetitionFormatUseCases";
import {
  create_mock_repository,
  create_test_format,
} from "./CompetitionFormatUseCases.test_support";

describe("CompetitionFormatUseCases", () => {
  let mock_repository: CompetitionFormatRepository;
  let use_cases: ReturnType<typeof create_competition_format_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_competition_format_use_cases(mock_repository);
  });

  describe("update", () => {
    it("should update with valid input", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: create_test_format(),
      });
      vi.mocked(mock_repository.find_by_code).mockResolvedValue(
        create_failure_result(
          build_competition_format_not_found_by_code_error("RR"),
        ),
      );
      vi.mocked(mock_repository.update).mockResolvedValue({
        success: true,
        data: create_test_format(),
      });

      const result = await use_cases.update("format-123", { name: "Updated" });

      expect(result.success).toBe(true);
      expect(mock_repository.update).toHaveBeenCalledWith(
        "format-123",
        expect.objectContaining({
          stage_templates: [
            {
              name: "Round Robin",
              stage_type: "league_stage",
              stage_order: 1,
            },
          ],
        }),
      );
    });

    it("should regenerate stage templates when format type changes", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: create_test_format(),
      });
      vi.mocked(mock_repository.find_by_code).mockResolvedValue(
        create_failure_result(
          build_competition_format_not_found_by_code_error("RR"),
        ),
      );
      vi.mocked(mock_repository.update).mockResolvedValue({
        success: true,
        data: create_test_format({ format_type: "straight_knockout" }),
      });

      const result = await use_cases.update("format-123", {
        format_type: "straight_knockout",
      });

      expect(result.success).toBe(true);
      expect(mock_repository.update).toHaveBeenCalledWith(
        "format-123",
        expect.objectContaining({
          stage_templates: [
            {
              name: "Round of 16",
              stage_type: "knockout_stage",
              stage_order: 1,
            },
            {
              name: "Quarter Finals",
              stage_type: "knockout_stage",
              stage_order: 2,
            },
            {
              name: "Semi Finals",
              stage_type: "knockout_stage",
              stage_order: 3,
            },
            {
              name: "Final",
              stage_type: "one_off_stage",
              stage_order: 4,
            },
          ],
        }),
      );
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.update("", { name: "Updated" });

      expect(result.success).toBe(false);
    });

    it("should preserve explicitly provided stage templates on update", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: create_test_format({
          stage_templates: [
            {
              name: "Round Robin",
              stage_type: "league_stage",
              stage_order: 1,
            },
          ],
        }),
      });
      vi.mocked(mock_repository.find_by_code).mockResolvedValue(
        create_failure_result(
          build_competition_format_not_found_by_code_error("RR"),
        ),
      );
      vi.mocked(mock_repository.update).mockResolvedValue({
        success: true,
        data: create_test_format(),
      });

      const result = await use_cases.update("format-123", {
        format_type: "groups_knockout",
        stage_templates: [
          {
            name: "Pool A and B",
            stage_type: "group_stage",
            stage_order: 1,
          },
          {
            name: "Gold Medal Match",
            stage_type: "one_off_stage",
            stage_order: 2,
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(mock_repository.update).toHaveBeenCalledWith(
        "format-123",
        expect.objectContaining({
          stage_templates: [
            {
              name: "Pool A and B",
              stage_type: "group_stage",
              stage_order: 1,
            },
            {
              name: "Gold Medal Match",
              stage_type: "one_off_stage",
              stage_order: 2,
            },
          ],
        }),
      );
    });
  });
});
