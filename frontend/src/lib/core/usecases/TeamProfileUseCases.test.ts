import { describe, it, expect, beforeEach, vi } from "vitest";
import type { TeamProfileRepository } from "../interfaces/adapters/TeamProfileRepository";
import type {
  TeamProfile,
  CreateTeamProfileInput,
} from "../entities/TeamProfile";
import type { QueryOptions } from "../interfaces/adapters/Repository";
import type { AsyncResult, PaginatedAsyncResult } from "../types/Result";
import { create_success_result, create_failure_result } from "../types/Result";
import { create_team_profile_use_cases } from "./TeamProfileUseCases";

function create_mock_team_profile(
  overrides: Partial<TeamProfile> = {},
): TeamProfile {
  return {
    id: "teamprofile_1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    team_id: "team_1",
    profile_summary: "Test team profile",
    visibility: "private",
    profile_slug: "test-team-1",
    featured_image_url: "",
    status: "active",
    ...overrides,
  };
}

function create_valid_team_profile_input(
  overrides: Partial<CreateTeamProfileInput> = {},
): CreateTeamProfileInput {
  return {
    team_id: "team_1",
    profile_summary: "Test team profile",
    visibility: "private",
    profile_slug: "test-team-1",
    featured_image_url: "",
    status: "active",
    ...overrides,
  };
}

function create_paginated_result<T>(
  items: T[],
  total_count?: number,
): PaginatedAsyncResult<T> {
  return create_success_result({
    items,
    total_count: total_count ?? items.length,
    page_number: 1,
    page_size: 10,
    total_pages: Math.ceil((total_count ?? items.length) / 10),
  });
}

function create_mock_repository(): TeamProfileRepository {
  return {
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    find_by_ids: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    delete_by_ids: vi.fn(),
    count: vi.fn(),
    find_by_filter: vi.fn(),
    find_by_team_id: vi.fn(),
    find_by_slug: vi.fn(),
    find_public_profiles: vi.fn(),
  };
}

describe("TeamProfileUseCases", () => {
  let mock_repository: TeamProfileRepository;
  let use_cases: ReturnType<typeof create_team_profile_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_team_profile_use_cases(mock_repository);
  });

  describe("list", () => {
    it("returns all team profiles when no filter provided", async () => {
      const mock_profiles = [
        create_mock_team_profile({ id: "tp1" }),
        create_mock_team_profile({ id: "tp2" }),
      ];
      vi.mocked(mock_repository.find_all).mockResolvedValue(
        create_paginated_result(mock_profiles),
      );

      const result = await use_cases.list();

      expect(result.success).toBe(true);
      expect(result.data.length).toBe(2);
      expect(result.total_count).toBe(2);
      expect(mock_repository.find_all).toHaveBeenCalledOnce();
    });

    it("filters by team_id", async () => {
      const mock_profiles = [create_mock_team_profile({ team_id: "team_1" })];
      vi.mocked(mock_repository.find_by_filter).mockResolvedValue(
        create_paginated_result(mock_profiles),
      );

      const result = await use_cases.list({ team_id: "team_1" });

      expect(result.success).toBe(true);
      expect(result.data.length).toBe(1);
      expect(mock_repository.find_by_filter).toHaveBeenCalledWith(
        expect.objectContaining({ team_id: "team_1" }),
        undefined,
      );
    });

    it("filters by visibility", async () => {
      const mock_profiles = [
        create_mock_team_profile({ visibility: "public" }),
      ];
      vi.mocked(mock_repository.find_by_filter).mockResolvedValue(
        create_paginated_result(mock_profiles),
      );

      const result = await use_cases.list({ visibility: "public" });

      expect(result.success).toBe(true);
      expect(result.data.length).toBe(1);
      expect(mock_repository.find_by_filter).toHaveBeenCalledWith(
        expect.objectContaining({ visibility: "public" }),
        undefined,
      );
    });

    it("passes query options to repository", async () => {
      vi.mocked(mock_repository.find_all).mockResolvedValue(
        create_paginated_result([]),
      );

      const options: QueryOptions = { page_number: 2, page_size: 20 };
      await use_cases.list(undefined, options);

      expect(mock_repository.find_all).toHaveBeenCalledWith(options);
    });

    it("handles repository failure", async () => {
      vi.mocked(mock_repository.find_all).mockResolvedValue(
        create_failure_result("Database error"),
      );

      const result = await use_cases.list();

      expect(result.success).toBe(false);
      expect(result.error_message).toBe("Database error");
      expect(result.data.length).toBe(0);
    });
  });

  describe("get_by_id", () => {
    it("returns team profile by id", async () => {
      const mock_profile = create_mock_team_profile({ id: "tp_123" });
      vi.mocked(mock_repository.find_by_id).mockResolvedValue(
        create_success_result(mock_profile),
      );

      const result = await use_cases.get_by_id("tp_123");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("tp_123");
      }
      expect(mock_repository.find_by_id).toHaveBeenCalledWith("tp_123");
    });

    it("returns failure when id is empty", async () => {
      const result = await use_cases.get_by_id("");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error_message).toBe("Profile ID is required");
      }
      expect(mock_repository.find_by_id).not.toHaveBeenCalled();
    });

    it("returns failure when id is whitespace", async () => {
      const result = await use_cases.get_by_id("   ");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error_message).toBe("Profile ID is required");
      }
    });

    it("handles repository failure", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue(
        create_failure_result("Profile not found"),
      );

      const result = await use_cases.get_by_id("tp_123");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error_message).toBe("Profile not found");
      }
    });
  });

  describe("get_by_team_id", () => {
    it("returns team profile by team_id", async () => {
      const mock_profile = create_mock_team_profile({ team_id: "team_abc" });
      vi.mocked(mock_repository.find_by_team_id).mockResolvedValue(
        create_success_result(mock_profile),
      );

      const result = await use_cases.get_by_team_id("team_abc");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.team_id).toBe("team_abc");
      }
      expect(mock_repository.find_by_team_id).toHaveBeenCalledWith("team_abc");
    });

    it("returns failure when team_id is empty", async () => {
      const result = await use_cases.get_by_team_id("");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error_message).toBe("Team ID is required");
      }
      expect(mock_repository.find_by_team_id).not.toHaveBeenCalled();
    });

    it("handles repository failure", async () => {
      vi.mocked(mock_repository.find_by_team_id).mockResolvedValue(
        create_failure_result("No profile found for team"),
      );

      const result = await use_cases.get_by_team_id("team_abc");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error_message).toBe("No profile found for team");
      }
    });
  });

  describe("get_by_slug", () => {
    it("returns team profile by slug", async () => {
      const mock_profile = create_mock_team_profile({
        profile_slug: "unique-slug",
      });
      vi.mocked(mock_repository.find_by_slug).mockResolvedValue(
        create_success_result(mock_profile),
      );

      const result = await use_cases.get_by_slug("unique-slug");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.profile_slug).toBe("unique-slug");
      }
      expect(mock_repository.find_by_slug).toHaveBeenCalledWith("unique-slug");
    });

    it("returns failure when slug is empty", async () => {
      const result = await use_cases.get_by_slug("");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error_message).toBe("Profile slug is required");
      }
      expect(mock_repository.find_by_slug).not.toHaveBeenCalled();
    });

    it("handles repository failure", async () => {
      vi.mocked(mock_repository.find_by_slug).mockResolvedValue(
        create_failure_result("No profile found with slug"),
      );

      const result = await use_cases.get_by_slug("nonexistent");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error_message).toBe("No profile found with slug");
      }
    });
  });

  describe("create", () => {
    it("creates team profile successfully", async () => {
      const input = create_valid_team_profile_input();
      const mock_profile = create_mock_team_profile(input);
      vi.mocked(mock_repository.create).mockResolvedValue(
        create_success_result(mock_profile),
      );

      const result = await use_cases.create(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.team_id).toBe("team_1");
      }
      expect(mock_repository.create).toHaveBeenCalledWith(input);
    });

    it("validates team_id is required", async () => {
      const input = create_valid_team_profile_input({ team_id: "" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error_message).toContain("Team is required");
      }
      expect(mock_repository.create).not.toHaveBeenCalled();
    });

    it("validates visibility values", async () => {
      const input = {
        ...create_valid_team_profile_input(),
        visibility: "invalid" as any,
      };

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error_message).toContain("Visibility must be");
      }
      expect(mock_repository.create).not.toHaveBeenCalled();
    });

    it("handles repository failure", async () => {
      const input = create_valid_team_profile_input();
      vi.mocked(mock_repository.create).mockResolvedValue(
        create_failure_result("Database error"),
      );

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error_message).toBe("Database error");
      }
    });
  });

  describe("update", () => {
    it("updates team profile successfully", async () => {
      const updates = { profile_summary: "Updated summary" };
      const mock_profile = create_mock_team_profile(updates);
      vi.mocked(mock_repository.update).mockResolvedValue(
        create_success_result(mock_profile),
      );

      const result = await use_cases.update("tp_123", updates);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.profile_summary).toBe("Updated summary");
      }
      expect(mock_repository.update).toHaveBeenCalledWith("tp_123", updates);
    });

    it("validates visibility on update", async () => {
      const updates = { visibility: "invalid" as any };

      const result = await use_cases.update("tp_123", updates);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error_message).toContain("Visibility must be");
      }
      expect(mock_repository.update).not.toHaveBeenCalled();
    });

    it("handles repository failure", async () => {
      vi.mocked(mock_repository.update).mockResolvedValue(
        create_failure_result("Profile not found"),
      );

      const result = await use_cases.update("tp_123", {
        profile_summary: "New",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error_message).toBe("Profile not found");
      }
    });
  });

  describe("delete", () => {
    it("deletes team profile successfully", async () => {
      vi.mocked(mock_repository.delete_by_id).mockResolvedValue(
        create_success_result(true),
      );

      const result = await use_cases.delete("tp_123");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
      expect(mock_repository.delete_by_id).toHaveBeenCalledWith("tp_123");
    });

    it("handles repository failure", async () => {
      vi.mocked(mock_repository.delete_by_id).mockResolvedValue(
        create_failure_result("Profile not found"),
      );

      const result = await use_cases.delete("tp_123");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error_message).toBe("Profile not found");
      }
    });
  });

  describe("list_public_profiles", () => {
    it("returns only public profiles", async () => {
      const mock_profiles = [
        create_mock_team_profile({ visibility: "public" }),
      ];
      vi.mocked(mock_repository.find_public_profiles).mockResolvedValue(
        create_paginated_result(mock_profiles),
      );

      const result = await use_cases.list_public_profiles();

      expect(result.success).toBe(true);
      expect(result.data.length).toBe(1);
      expect(mock_repository.find_public_profiles).toHaveBeenCalledOnce();
    });

    it("passes query options to repository", async () => {
      vi.mocked(mock_repository.find_public_profiles).mockResolvedValue(
        create_paginated_result([]),
      );

      const options: QueryOptions = { page_number: 2, page_size: 20 };
      await use_cases.list_public_profiles(options);

      expect(mock_repository.find_public_profiles).toHaveBeenCalledWith(
        options,
      );
    });

    it("handles repository failure", async () => {
      vi.mocked(mock_repository.find_public_profiles).mockResolvedValue(
        create_failure_result("Database error"),
      );

      const result = await use_cases.list_public_profiles();

      expect(result.success).toBe(false);
      expect(result.error_message).toBe("Database error");
    });
  });
});
