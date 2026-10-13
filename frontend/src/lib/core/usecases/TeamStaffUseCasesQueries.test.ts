import { beforeEach, describe, expect, it, vi } from "vitest";

import type { TeamStaffRepository } from "../interfaces/ports";
import { create_team_staff_use_cases } from "./TeamStaffUseCases";
import {
  create_mock_repository,
  create_mock_roles_repository,
  create_test_staff,
} from "./TeamStaffUseCases.test_support";

describe("TeamStaffUseCases", () => {
  let mock_repository: TeamStaffRepository;
  let use_cases: ReturnType<typeof create_team_staff_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_team_staff_use_cases(
      mock_repository,
      create_mock_roles_repository(),
    );
  });

  describe("list", () => {
    it("should return all staff when no filter", async () => {
      vi.mocked(mock_repository.find_all).mockResolvedValue({
        success: true,
        data: {
          items: [create_test_staff()],
          total_count: 1,
          page_number: 1,
          page_size: 10,
          total_pages: 1,
        },
      });

      const result = await use_cases.list();

      expect(result.success).toBe(true);
      expect(mock_repository.find_all).toHaveBeenCalledWith({}, {});
    });

    it("should pass team_id filter to repository when provided", async () => {
      const team_a_staff = create_test_staff({
        id: "staff-a",
        team_id: "team-a",
      });
      vi.mocked(mock_repository.find_all).mockResolvedValue({
        success: true,
        data: {
          items: [team_a_staff],
          total_count: 1,
          page_number: 1,
          page_size: 10,
          total_pages: 1,
        },
      });

      const filter = { team_id: "team-a" };
      const result = await use_cases.list(filter);

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(mock_repository.find_all).toHaveBeenCalledWith(filter, {});
      expect(result.data.items).toHaveLength(1);
    });

    it("should pass organization_id filter to repository when provided", async () => {
      vi.mocked(mock_repository.find_all).mockResolvedValue({
        success: true,
        data: {
          items: [create_test_staff()],
          total_count: 1,
          page_number: 1,
          page_size: 10,
          total_pages: 1,
        },
      });

      const filter = { organization_id: "org-123" };
      const result = await use_cases.list(filter);

      expect(result.success).toBe(true);
      expect(mock_repository.find_all).toHaveBeenCalledWith(filter, {});
    });

    it("should pass combined team_id and organization_id filter to repository", async () => {
      vi.mocked(mock_repository.find_all).mockResolvedValue({
        success: true,
        data: {
          items: [create_test_staff()],
          total_count: 1,
          page_number: 1,
          page_size: 10,
          total_pages: 1,
        },
      });

      const filter = { team_id: "team-123", organization_id: "org-123" };
      const result = await use_cases.list(filter);

      expect(result.success).toBe(true);
      expect(mock_repository.find_all).toHaveBeenCalledWith(filter, {});
    });
  });

  describe("get_by_id", () => {
    it("should return staff when found", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: create_test_staff(),
      });

      const result = await use_cases.get_by_id("staff-123");

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.get_by_id("");

      expect(result.success).toBe(false);
    });
  });

  describe("list_staff_by_team", () => {
    it("should return staff for team", async () => {
      vi.mocked(mock_repository.find_by_team).mockResolvedValue({
        success: true,
        data: [create_test_staff()],
      });

      const result = await use_cases.list_staff_by_team("team-123");

      expect(result.success).toBe(true);
    });

    it("should fail for empty team_id", async () => {
      const result = await use_cases.list_staff_by_team("");

      expect(result.success).toBe(false);
    });
  });
});
