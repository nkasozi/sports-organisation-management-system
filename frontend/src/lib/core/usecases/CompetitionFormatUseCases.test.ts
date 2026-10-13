import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CompetitionFormatRepository } from "../interfaces/ports";
import { build_competition_format_not_found_by_code_error } from "../interfaces/ports";
import { create_failure_result } from "../types/Result";
import { create_competition_format_use_cases } from "./CompetitionFormatUseCases";
import {
  create_mock_repository,
  create_test_format,
  create_valid_input,
} from "./CompetitionFormatUseCases.test_support";

describe("CompetitionFormatUseCases", () => {
  let mock_repository: CompetitionFormatRepository;
  let use_cases: ReturnType<typeof create_competition_format_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_competition_format_use_cases(mock_repository);
  });

  describe("list", () => {
    it("should return all formats when no filter", async () => {
      vi.mocked(mock_repository.find_all).mockResolvedValue({
        success: true,
        data: {
          items: [create_test_format()],
          total_count: 1,
          page_number: 1,
          page_size: 10,
          total_pages: 1,
        },
      });

      const result = await use_cases.list();

      expect(result.success).toBe(true);
    });
  });

  describe("get_by_id", () => {
    it("should return format when found", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: create_test_format(),
      });

      const result = await use_cases.get_by_id("format-123");

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.get_by_id("");

      expect(result.success).toBe(false);
    });
  });

  describe("create", () => {
    it("should create with valid input", async () => {
      vi.mocked(mock_repository.find_by_code).mockResolvedValue(
        create_failure_result(
          build_competition_format_not_found_by_code_error("KO"),
        ),
      );
      vi.mocked(mock_repository.create).mockResolvedValue({
        success: true,
        data: create_test_format(),
      });

      const result = await use_cases.create(create_valid_input());

      expect(result.success).toBe(true);
      expect(mock_repository.create).toHaveBeenCalledWith(
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

    it("should fail for empty name", async () => {
      const result = await use_cases.create(create_valid_input({ name: "" }));

      expect(result.success).toBe(false);
    });

    it("should preserve explicitly provided stage templates on create", async () => {
      vi.mocked(mock_repository.find_by_code).mockResolvedValue(
        create_failure_result(
          build_competition_format_not_found_by_code_error("KO"),
        ),
      );
      vi.mocked(mock_repository.create).mockResolvedValue({
        success: true,
        data: create_test_format(),
      });

      const result = await use_cases.create(
        create_valid_input({
          stage_templates: [
            {
              name: "Preliminary Round",
              stage_type: "league_stage",
              stage_order: 1,
            },
            {
              name: "Championship Final",
              stage_type: "one_off_stage",
              stage_order: 2,
            },
          ],
        }),
      );

      expect(result.success).toBe(true);
      expect(mock_repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          stage_templates: [
            {
              name: "Preliminary Round",
              stage_type: "league_stage",
              stage_order: 1,
            },
            {
              name: "Championship Final",
              stage_type: "one_off_stage",
              stage_order: 2,
            },
          ],
        }),
      );
    });
  });

  describe("delete", () => {
    it("should delete by id", async () => {
      vi.mocked(mock_repository.delete_by_id).mockResolvedValue({
        success: true,
        data: true,
      });

      const result = await use_cases.delete("format-123");

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.delete("");

      expect(result.success).toBe(false);
    });
  });
});
