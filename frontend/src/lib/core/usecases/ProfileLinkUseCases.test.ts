import { describe, it, expect, beforeEach, vi } from "vitest";
import type { ProfileLinkRepository } from "../interfaces/adapters/ProfileLinkRepository";
import type {
  ProfileLink,
  CreateProfileLinkInput,
} from "../entities/ProfileLink";
import type { QueryOptions } from "../interfaces/adapters/Repository";
import type { PaginatedAsyncResult } from "../types/Result";
import { create_success_result, create_failure_result } from "../types/Result";
import { create_profile_link_use_cases } from "./ProfileLinkUseCases";

function create_mock_profile_link(
  overrides: Partial<ProfileLink> = {},
): ProfileLink {
  return {
    id: "profilelink_1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    profile_id: "profile_1",
    platform: "twitter",
    title: "Follow on Twitter",
    url: "https://twitter.com/username",
    display_order: 0,
    status: "active",
    ...overrides,
  };
}

function create_valid_profile_link_input(
  overrides: Partial<CreateProfileLinkInput> = {},
): CreateProfileLinkInput {
  return {
    profile_id: "profile_1",
    platform: "twitter",
    title: "Follow on Twitter",
    url: "https://twitter.com/username",
    display_order: 0,
    status: "active",
    ...overrides,
  };
}

import type { Result, PaginatedResult } from "../types/Result";

function create_paginated_result<T>(
  items: T[],
  total_count?: number,
): Result<PaginatedResult<T>, string> {
  return create_success_result({
    items,
    total_count: total_count ?? items.length,
    page_number: 1,
    page_size: 10,
    total_pages: Math.ceil((total_count ?? items.length) / 10),
  });
}

function create_mock_repository(): ProfileLinkRepository {
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
    find_by_profile_id: vi.fn(),
  };
}

describe("ProfileLinkUseCases", () => {
  let mock_repository: ProfileLinkRepository;
  let use_cases: ReturnType<typeof create_profile_link_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_profile_link_use_cases(mock_repository);
  });

  describe("list", () => {
    it("returns all profile links when no filter provided", async () => {
      const mock_links = [
        create_mock_profile_link({ id: "pl1" }),
        create_mock_profile_link({ id: "pl2" }),
      ];
      vi.mocked(mock_repository.find_all).mockResolvedValue(
        create_paginated_result(mock_links),
      );

      const result = await use_cases.list();

      expect(result.success).toBe(true);
      expect(result.data.length).toBe(2);
      expect(result.total_count).toBe(2);
      expect(mock_repository.find_all).toHaveBeenCalledOnce();
    });

    it("filters by profile_id", async () => {
      const mock_links = [
        create_mock_profile_link({ profile_id: "profile_1" }),
      ];
      vi.mocked(mock_repository.find_by_filter).mockResolvedValue(
        create_paginated_result(mock_links),
      );

      const result = await use_cases.list({ profile_id: "profile_1" });

      expect(result.success).toBe(true);
      expect(result.data.length).toBe(1);
      expect(mock_repository.find_by_filter).toHaveBeenCalledWith(
        expect.objectContaining({ profile_id: "profile_1" }),
        undefined,
      );
    });

    it("filters by platform", async () => {
      const mock_links = [create_mock_profile_link({ platform: "twitter" })];
      vi.mocked(mock_repository.find_by_filter).mockResolvedValue(
        create_paginated_result(mock_links),
      );

      const result = await use_cases.list({ platform: "twitter" });

      expect(result.success).toBe(true);
      expect(result.data.length).toBe(1);
      expect(mock_repository.find_by_filter).toHaveBeenCalledWith(
        expect.objectContaining({ platform: "twitter" }),
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
    it("returns profile link by id", async () => {
      const mock_link = create_mock_profile_link({ id: "pl_123" });
      vi.mocked(mock_repository.find_by_id).mockResolvedValue(
        create_success_result(mock_link),
      );

      const result = await use_cases.get_by_id("pl_123");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data!.id).toBe("pl_123");
      }
      expect(mock_repository.find_by_id).toHaveBeenCalledWith("pl_123");
    });

    it("returns failure when id is empty", async () => {
      const result = await use_cases.get_by_id("");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error_message).toBe("Link ID is required");
      }
      expect(mock_repository.find_by_id).not.toHaveBeenCalled();
    });

    it("handles repository failure", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue(
        create_failure_result("Link not found"),
      );

      const result = await use_cases.get_by_id("pl_123");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error_message).toBe("Link not found");
      }
    });
  });

  describe("list_by_profile", () => {
    it("returns all links for profile", async () => {
      const mock_links = [
        create_mock_profile_link({ platform: "twitter" }),
        create_mock_profile_link({ platform: "instagram" }),
      ];
      vi.mocked(mock_repository.find_by_profile_id).mockResolvedValue(
        create_paginated_result(mock_links),
      );

      const result = await use_cases.list_by_profile("profile_1");

      expect(result.success).toBe(true);
      expect(result.data.length).toBe(2);
      expect(mock_repository.find_by_profile_id).toHaveBeenCalledWith(
        "profile_1",
        undefined,
      );
    });

    it("handles repository failure", async () => {
      vi.mocked(mock_repository.find_by_profile_id).mockResolvedValue(
        create_failure_result("Database error"),
      );

      const result = await use_cases.list_by_profile("profile_1");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error_message).toBe("Database error");
      }
    });
  });

  describe("create", () => {
    it("creates profile link successfully", async () => {
      const input = create_valid_profile_link_input();
      const mock_link = create_mock_profile_link(input);
      vi.mocked(mock_repository.create).mockResolvedValue(
        create_success_result(mock_link),
      );

      const result = await use_cases.create(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data!.profile_id).toBe("profile_1");
      }
      expect(mock_repository.create).toHaveBeenCalledWith(input);
    });

    it("validates profile_id is required", async () => {
      const input = create_valid_profile_link_input({ profile_id: "" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error_message).toContain("Profile is required");
      }
      expect(mock_repository.create).not.toHaveBeenCalled();
    });

    it("validates platform is required", async () => {
      const input = create_valid_profile_link_input({ platform: "" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error_message).toContain("Platform is required");
      }
      expect(mock_repository.create).not.toHaveBeenCalled();
    });

    it("validates url is required", async () => {
      const input = create_valid_profile_link_input({ url: "" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error_message).toContain("URL is required");
      }
      expect(mock_repository.create).not.toHaveBeenCalled();
    });

    it("validates url format", async () => {
      const input = create_valid_profile_link_input({ url: "not-a-url" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error_message).toContain("valid URL");
      }
      expect(mock_repository.create).not.toHaveBeenCalled();
    });

    it("handles repository failure", async () => {
      const input = create_valid_profile_link_input();
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
    it("updates profile link successfully", async () => {
      const updates = { title: "Updated title" };
      const mock_link = create_mock_profile_link(updates);
      vi.mocked(mock_repository.update).mockResolvedValue(
        create_success_result(mock_link),
      );

      const result = await use_cases.update("pl_123", updates);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data!.title).toBe("Updated title");
      }
      expect(mock_repository.update).toHaveBeenCalledWith("pl_123", updates);
    });

    it("handles repository failure", async () => {
      vi.mocked(mock_repository.update).mockResolvedValue(
        create_failure_result("Link not found"),
      );

      const result = await use_cases.update("pl_123", { title: "New" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error_message).toBe("Link not found");
      }
    });
  });

  describe("delete", () => {
    it("deletes profile link successfully", async () => {
      vi.mocked(mock_repository.delete_by_id).mockResolvedValue(
        create_success_result(true),
      );

      const result = await use_cases.delete("pl_123");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
      expect(mock_repository.delete_by_id).toHaveBeenCalledWith("pl_123");
    });

    it("handles repository failure", async () => {
      vi.mocked(mock_repository.delete_by_id).mockResolvedValue(
        create_failure_result("Link not found"),
      );

      const result = await use_cases.delete("pl_123");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error_message).toBe("Link not found");
      }
    });
  });
});
