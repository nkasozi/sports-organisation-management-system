import { describe, it, expect, beforeEach, vi } from "vitest";
import type { PlayerProfileRepository } from "../interfaces/adapters/PlayerProfileRepository";
import type {
  PlayerProfile,
  CreatePlayerProfileInput,
} from "../entities/PlayerProfile";
import type { QueryOptions } from "../interfaces/adapters/Repository";
import type { PaginatedAsyncResult } from "../types/Result";
import { create_success_result, create_failure_result } from "../types/Result";
import { create_player_profile_use_cases } from "./PlayerProfileUseCases";

function create_mock_player_profile(
  overrides: Partial<PlayerProfile> = {},
): PlayerProfile {
  return {
    id: "profile_1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    player_id: "player_1",
    profile_summary: "Test player profile",
    visibility: "private",
    profile_slug: "test-player-1",
    featured_image_url: "",
    status: "active",
    ...overrides,
  };
}

function create_valid_player_profile_input(
  overrides: Partial<CreatePlayerProfileInput> = {},
): CreatePlayerProfileInput {
  return {
    player_id: "player_1",
    profile_summary: "Test player profile",
    visibility: "private",
    profile_slug: "test-player-1",
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

function create_mock_repository(): PlayerProfileRepository {
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
    find_by_player_id: vi.fn(),
    find_by_slug: vi.fn(),
    find_public_profiles: vi.fn(),
  };
}

describe("PlayerProfileUseCases", () => {
  let mock_repository: PlayerProfileRepository;
  let use_cases: ReturnType<typeof create_player_profile_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_player_profile_use_cases(mock_repository);
  });

  describe("list", () => {
    it("returns all player profiles when no filter provided", async () => {
      const mock_profiles = [
        create_mock_player_profile({ id: "p1" }),
        create_mock_player_profile({ id: "p2" }),
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

    it("filters by player_id", async () => {
      const mock_profiles = [
        create_mock_player_profile({ player_id: "player_1" }),
      ];
      vi.mocked(mock_repository.find_by_filter).mockResolvedValue(
        create_paginated_result(mock_profiles),
      );

      const result = await use_cases.list({ player_id: "player_1" });

      expect(result.success).toBe(true);
      expect(result.data.length).toBe(1);
      expect(mock_repository.find_by_filter).toHaveBeenCalledWith(
        expect.objectContaining({ player_id: "player_1" }),
        undefined,
      );
    });

    it("filters by visibility", async () => {
      const mock_profiles = [
        create_mock_player_profile({ visibility: "public" }),
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
    it("returns player profile by id", async () => {
      const mock_profile = create_mock_player_profile({ id: "p_123" });
      vi.mocked(mock_repository.find_by_id).mockResolvedValue(
        create_success_result(mock_profile),
      );

      const result = await use_cases.get_by_id("p_123");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("p_123");
      }
      expect(mock_repository.find_by_id).toHaveBeenCalledWith("p_123");
    });

    it("returns failure when id is empty", async () => {
      const result = await use_cases.get_by_id("");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error_message).toBe("Profile ID is required");
      }
      expect(mock_repository.find_by_id).not.toHaveBeenCalled();
    });

    it("handles repository failure", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue(
        create_failure_result("Profile not found"),
      );

      const result = await use_cases.get_by_id("p_123");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error_message).toBe("Profile not found");
      }
    });
  });

  describe("get_by_player_id", () => {
    it("returns player profile by player_id", async () => {
      const mock_profile = create_mock_player_profile({
        player_id: "player_abc",
      });
      vi.mocked(mock_repository.find_by_player_id).mockResolvedValue(
        create_success_result(mock_profile),
      );

      const result = await use_cases.get_by_player_id("player_abc");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.player_id).toBe("player_abc");
      }
      expect(mock_repository.find_by_player_id).toHaveBeenCalledWith(
        "player_abc",
      );
    });

    it("returns failure when player_id is empty", async () => {
      const result = await use_cases.get_by_player_id("");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error_message).toBe("Player ID is required");
      }
      expect(mock_repository.find_by_player_id).not.toHaveBeenCalled();
    });

    it("handles repository failure", async () => {
      vi.mocked(mock_repository.find_by_player_id).mockResolvedValue(
        create_failure_result("No profile found for player"),
      );

      const result = await use_cases.get_by_player_id("player_abc");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error_message).toBe("No profile found for player");
      }
    });
  });

  describe("get_by_slug", () => {
    it("returns player profile by slug", async () => {
      const mock_profile = create_mock_player_profile({
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
    it("creates player profile successfully", async () => {
      const input = create_valid_player_profile_input();
      const mock_profile = create_mock_player_profile(input);
      vi.mocked(mock_repository.find_by_player_id).mockResolvedValue(
        create_failure_result("No profile found"),
      );
      vi.mocked(mock_repository.create).mockResolvedValue(
        create_success_result(mock_profile),
      );

      const result = await use_cases.create(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.player_id).toBe("player_1");
      }
      expect(mock_repository.create).toHaveBeenCalledWith(input);
    });

    it("validates player_id is required", async () => {
      const input = create_valid_player_profile_input({ player_id: "" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error_message).toContain("Player is required");
      }
      expect(mock_repository.create).not.toHaveBeenCalled();
    });

    it("validates visibility values", async () => {
      const input = {
        ...create_valid_player_profile_input(),
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
      const input = create_valid_player_profile_input();
      vi.mocked(mock_repository.find_by_player_id).mockResolvedValue(
        create_failure_result("No profile found"),
      );
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
    it("updates player profile successfully", async () => {
      const updates = { profile_summary: "Updated summary" };
      const mock_profile = create_mock_player_profile(updates);
      vi.mocked(mock_repository.update).mockResolvedValue(
        create_success_result(mock_profile),
      );

      const result = await use_cases.update("p_123", updates);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.profile_summary).toBe("Updated summary");
      }
      expect(mock_repository.update).toHaveBeenCalledWith("p_123", updates);
    });

    it("validates visibility on update", async () => {
      const updates = { visibility: "invalid" as any };

      const result = await use_cases.update("p_123", updates);

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

      const result = await use_cases.update("p_123", {
        profile_summary: "New",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error_message).toBe("Profile not found");
      }
    });
  });

  describe("delete", () => {
    it("deletes player profile successfully", async () => {
      vi.mocked(mock_repository.delete_by_id).mockResolvedValue(
        create_success_result(true),
      );

      const result = await use_cases.delete("p_123");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
      expect(mock_repository.delete_by_id).toHaveBeenCalledWith("p_123");
    });

    it("handles repository failure", async () => {
      vi.mocked(mock_repository.delete_by_id).mockResolvedValue(
        create_failure_result("Profile not found"),
      );

      const result = await use_cases.delete("p_123");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error_message).toBe("Profile not found");
      }
    });
  });

  describe("list_public_profiles", () => {
    it("returns only public profiles", async () => {
      const mock_profiles = [
        create_mock_player_profile({ visibility: "public" }),
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
