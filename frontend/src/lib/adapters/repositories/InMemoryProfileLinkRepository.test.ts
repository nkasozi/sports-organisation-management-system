import { describe, it, expect, beforeEach } from "vitest";
import {
  InMemoryProfileLinkRepository,
  reset_profile_link_repository,
} from "./InMemoryProfileLinkRepository";
import type { CreateProfileLinkInput } from "../../core/entities/ProfileLink";

describe("InMemoryProfileLinkRepository", () => {
  let repository: InMemoryProfileLinkRepository;

  beforeEach(() => {
    reset_profile_link_repository();
    repository = new InMemoryProfileLinkRepository();
  });

  function create_valid_profile_link_input(
    overrides: Partial<CreateProfileLinkInput> = {},
  ): CreateProfileLinkInput {
    return {
      profile_id: "profile_123",
      platform: "twitter",
      title: "Follow on Twitter",
      url: "https://twitter.com/username",
      display_order: 0,
      status: "active",
      ...overrides,
    };
  }

  describe("create", () => {
    it("creates profile link successfully", async () => {
      const input = create_valid_profile_link_input();
      const result = await repository.create(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.profile_id).toBe("profile_123");
        expect(result.data.platform).toBe("twitter");
        expect(result.data.title).toBe("Follow on Twitter");
        expect(result.data.url).toBe("https://twitter.com/username");
        expect(result.data.display_order).toBe(0);
        expect(result.data.id).toBeTruthy();
        expect(result.data.created_at).toBeTruthy();
        expect(result.data.updated_at).toBeTruthy();
      }
    });

    it("generates unique id with profilelink prefix", async () => {
      const input = create_valid_profile_link_input();
      const result = await repository.create(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id.startsWith("profilelink-")).toBe(true);
      }
    });

    it("handles display_order", async () => {
      const input = create_valid_profile_link_input({ display_order: 5 });
      const result = await repository.create(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.display_order).toBe(5);
      }
    });

    it("defaults display_order to 0 when not provided", async () => {
      const input = {
        ...create_valid_profile_link_input(),
        display_order: undefined as any,
      };
      const result = await repository.create(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.display_order).toBe(0);
      }
    });
  });

  describe("find_by_profile_id", () => {
    it("finds all links for profile", async () => {
      await repository.create(
        create_valid_profile_link_input({
          profile_id: "profile_abc",
          platform: "twitter",
        }),
      );
      await repository.create(
        create_valid_profile_link_input({
          profile_id: "profile_abc",
          platform: "instagram",
        }),
      );
      await repository.create(
        create_valid_profile_link_input({
          profile_id: "profile_xyz",
          platform: "facebook",
        }),
      );

      const result = await repository.find_by_profile_id("profile_abc");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items.length).toBe(2);
        expect(
          result.data.items.every((link) => link.profile_id === "profile_abc"),
        ).toBe(true);
      }
    });

    it("returns empty array when no links found", async () => {
      const result = await repository.find_by_profile_id("nonexistent_profile");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items.length).toBe(0);
      }
    });

    it("sorts by display_order", async () => {
      await repository.create(
        create_valid_profile_link_input({
          profile_id: "profile_1",
          display_order: 3,
          platform: "twitter",
        }),
      );
      await repository.create(
        create_valid_profile_link_input({
          profile_id: "profile_1",
          display_order: 1,
          platform: "instagram",
        }),
      );
      await repository.create(
        create_valid_profile_link_input({
          profile_id: "profile_1",
          display_order: 2,
          platform: "facebook",
        }),
      );

      const result = await repository.find_by_profile_id("profile_1");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items.length).toBe(3);
        expect(result.data.items[0].platform).toBe("instagram");
        expect(result.data.items[1].platform).toBe("facebook");
        expect(result.data.items[2].platform).toBe("twitter");
      }
    });

    it("supports pagination", async () => {
      for (let i = 1; i <= 5; i++) {
        await repository.create(
          create_valid_profile_link_input({
            profile_id: "profile_1",
            platform: `platform_${i}`,
          }),
        );
      }

      const result = await repository.find_by_profile_id("profile_1", {
        page_number: 1,
        page_size: 2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items.length).toBe(2);
        expect(result.data.total_count).toBe(5);
        expect(result.data.total_pages).toBe(3);
      }
    });
  });

  describe("find_by_filter", () => {
    it("filters by profile_id", async () => {
      await repository.create(
        create_valid_profile_link_input({ profile_id: "profile_abc" }),
      );
      await repository.create(
        create_valid_profile_link_input({ profile_id: "profile_xyz" }),
      );

      const result = await repository.find_by_filter({
        profile_id: "profile_abc",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items.length).toBe(1);
        expect(result.data.items[0].profile_id).toBe("profile_abc");
      }
    });

    it("filters by platform", async () => {
      await repository.create(
        create_valid_profile_link_input({ platform: "twitter" }),
      );
      await repository.create(
        create_valid_profile_link_input({ platform: "instagram" }),
      );
      await repository.create(
        create_valid_profile_link_input({ platform: "twitter" }),
      );

      const result = await repository.find_by_filter({ platform: "twitter" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items.length).toBe(2);
        expect(
          result.data.items.every((link) => link.platform === "twitter"),
        ).toBe(true);
      }
    });

    it("filters by status", async () => {
      await repository.create(
        create_valid_profile_link_input({ status: "active" }),
      );
      await repository.create(
        create_valid_profile_link_input({ status: "inactive" }),
      );

      const result = await repository.find_by_filter({ status: "active" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items.length).toBe(1);
        expect(result.data.items[0].status).toBe("active");
      }
    });

    it("combines multiple filters", async () => {
      await repository.create(
        create_valid_profile_link_input({
          profile_id: "profile_1",
          platform: "twitter",
          status: "active",
        }),
      );
      await repository.create(
        create_valid_profile_link_input({
          profile_id: "profile_1",
          platform: "instagram",
          status: "active",
        }),
      );
      await repository.create(
        create_valid_profile_link_input({
          profile_id: "profile_2",
          platform: "twitter",
          status: "active",
        }),
      );

      const result = await repository.find_by_filter({
        profile_id: "profile_1",
        platform: "twitter",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items.length).toBe(1);
        expect(result.data.items[0].profile_id).toBe("profile_1");
        expect(result.data.items[0].platform).toBe("twitter");
      }
    });

    it("returns all links when no filter provided", async () => {
      await repository.create(create_valid_profile_link_input());
      await repository.create(create_valid_profile_link_input());

      const result = await repository.find_by_filter({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items.length).toBe(2);
      }
    });
  });

  describe("update", () => {
    it("updates link fields", async () => {
      const create_result = await repository.create(
        create_valid_profile_link_input(),
      );
      expect(create_result.success).toBe(true);

      if (create_result.success) {
        const update_result = await repository.update(create_result.data.id, {
          title: "Updated title",
          url: "https://new-url.com",
          display_order: 10,
        });

        expect(update_result.success).toBe(true);
        if (update_result.success) {
          expect(update_result.data.title).toBe("Updated title");
          expect(update_result.data.url).toBe("https://new-url.com");
          expect(update_result.data.display_order).toBe(10);
          expect(update_result.data.profile_id).toBe("profile_123");
          expect(update_result.data.platform).toBe("twitter");
        }
      }
    });

    it("preserves profile_id on update", async () => {
      const create_result = await repository.create(
        create_valid_profile_link_input({ profile_id: "profile_original" }),
      );
      expect(create_result.success).toBe(true);

      if (create_result.success) {
        const update_result = await repository.update(create_result.data.id, {
          title: "New title",
        });

        expect(update_result.success).toBe(true);
        if (update_result.success) {
          expect(update_result.data.profile_id).toBe("profile_original");
        }
      }
    });
  });

  describe("delete_by_id", () => {
    it("deletes link successfully", async () => {
      const create_result = await repository.create(
        create_valid_profile_link_input(),
      );
      expect(create_result.success).toBe(true);

      if (create_result.success) {
        const delete_result = await repository.delete_by_id(
          create_result.data.id,
        );
        expect(delete_result.success).toBe(true);

        const find_result = await repository.find_by_id(create_result.data.id);
        expect(find_result.success).toBe(false);
      }
    });

    it("returns failure when deleting non-existent link", async () => {
      const result = await repository.delete_by_id("nonexistent_id");

      expect(result.success).toBe(false);
    });
  });
});
