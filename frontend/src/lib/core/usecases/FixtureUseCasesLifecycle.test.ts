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

  describe("start_fixture", () => {
    it("should start fixture", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: create_test_fixture(),
      });
      vi.mocked(mock_repository.update).mockResolvedValue({
        success: true,
        data: create_test_fixture({ status: "in_progress" }),
      });

      const result = await use_cases.start_fixture("fixture-123", "first_half");

      expect(result.success).toBe(true);
      expect(mock_repository.update).toHaveBeenCalledWith(
        "fixture-123",
        expect.objectContaining({
          status: "in_progress",
          current_period: "first_half",
        }),
      );
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.start_fixture("", "first_half");

      expect(result.success).toBe(false);
    });
  });

  describe("end_fixture", () => {
    it("should end fixture", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: create_test_fixture({ status: "in_progress" }),
      });
      vi.mocked(mock_repository.update).mockResolvedValue({
        success: true,
        data: create_test_fixture({ status: "completed" }),
      });

      const result = await use_cases.end_fixture("fixture-123");

      expect(result.success).toBe(true);
      expect(mock_repository.update).toHaveBeenCalledWith(
        "fixture-123",
        expect.objectContaining({
          status: "completed",
          current_period: "finished",
        }),
      );
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.end_fixture("");

      expect(result.success).toBe(false);
    });
  });
});
