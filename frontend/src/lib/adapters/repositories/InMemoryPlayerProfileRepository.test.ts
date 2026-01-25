import { describe, it, expect, beforeEach } from "vitest";
import {
  InMemoryPlayerProfileRepository,
  reset_player_profile_repository,
} from "./InMemoryPlayerProfileRepository";
import type { CreatePlayerProfileInput } from "../../core/entities/PlayerProfile";

describe("InMemoryPlayerProfileRepository", () => {
  let repository: InMemoryPlayerProfileRepository;

  beforeEach(() => {
    reset_player_profile_repository();
    repository = new InMemoryPlayerProfileRepository();
  });

  function create_valid_player_profile_input(
    overrides: Partial<CreatePlayerProfileInput> = {},
  ): CreatePlayerProfileInput {
    return {
      player_id: "player_123",
      profile_summary: "Test player profile summary",
      visibility: "private",
      profile_slug: "test-player-123",
      featured_image_url: "",
      status: "active",
      ...overrides,
    };
  }

  describe("create", () => {
    it("creates player profile successfully", async () => {
      const input = create_valid_player_profile_input();
      const result = await repository.create(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.player_id).toBe("player_123");
        expect(result.data.profile_summary).toBe("Test player profile summary");
        expect(result.data.visibility).toBe("private");
        expect(result.data.profile_slug).toBe("test-player-123");
        expect(result.data.id).toBeTruthy();
        expect(result.data.created_at).toBeTruthy();
        expect(result.data.updated_at).toBeTruthy();
      }
    });

    it("generates unique id with profile prefix", async () => {
      const input = create_valid_player_profile_input();
      const result = await repository.create(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id.startsWith("profile-")).toBe(true);
      }
    });

    it("creates public profile", async () => {
      const input = create_valid_player_profile_input({
        visibility: "public",
      });
      const result = await repository.create(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.visibility).toBe("public");
      }
    });

    it("handles empty featured_image_url", async () => {
      const input = create_valid_player_profile_input({
        featured_image_url: "",
      });
      const result = await repository.create(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.featured_image_url).toBe("");
      }
    });
  });

  describe("find_by_player_id", () => {
    it("finds profile by player_id", async () => {
      const input = create_valid_player_profile_input({
        player_id: "player_abc",
      });
      const create_result = await repository.create(input);
      expect(create_result.success).toBe(true);

      const find_result = await repository.find_by_player_id("player_abc");

      expect(find_result.success).toBe(true);
      if (find_result.success) {
        expect(find_result.data.player_id).toBe("player_abc");
      }
    });

    it("returns failure when player_id not found", async () => {
      const result = await repository.find_by_player_id("nonexistent_player");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("No profile found for player");
      }
    });

    it("finds correct profile when multiple exist", async () => {
      await repository.create(
        create_valid_player_profile_input({ player_id: "player_1" }),
      );
      await repository.create(
        create_valid_player_profile_input({ player_id: "player_2" }),
      );
      await repository.create(
        create_valid_player_profile_input({ player_id: "player_3" }),
      );

      const result = await repository.find_by_player_id("player_2");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.player_id).toBe("player_2");
      }
    });
  });

  describe("find_by_slug", () => {
    it("finds profile by slug", async () => {
      const input = create_valid_player_profile_input({
        profile_slug: "unique-slug-123",
      });
      const create_result = await repository.create(input);
      expect(create_result.success).toBe(true);

      const find_result = await repository.find_by_slug("unique-slug-123");

      expect(find_result.success).toBe(true);
      if (find_result.success) {
        expect(find_result.data.profile_slug).toBe("unique-slug-123");
      }
    });

    it("returns failure when slug not found", async () => {
      const result = await repository.find_by_slug("nonexistent-slug");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("No profile found with slug");
      }
    });

    it("finds correct profile when multiple exist", async () => {
      await repository.create(
        create_valid_player_profile_input({ profile_slug: "slug-1" }),
      );
      await repository.create(
        create_valid_player_profile_input({ profile_slug: "slug-2" }),
      );
      await repository.create(
        create_valid_player_profile_input({ profile_slug: "slug-3" }),
      );

      const result = await repository.find_by_slug("slug-2");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.profile_slug).toBe("slug-2");
      }
    });
  });

  describe("find_public_profiles", () => {
    it("returns only public profiles", async () => {
      await repository.create(
        create_valid_player_profile_input({
          player_id: "player_1",
          visibility: "public",
        }),
      );
      await repository.create(
        create_valid_player_profile_input({
          player_id: "player_2",
          visibility: "private",
        }),
      );
      await repository.create(
        create_valid_player_profile_input({
          player_id: "player_3",
          visibility: "public",
        }),
      );

      const result = await repository.find_public_profiles();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items.length).toBe(2);
        expect(result.data.items.every((p) => p.visibility === "public")).toBe(
          true,
        );
      }
    });

    it("returns only active profiles", async () => {
      await repository.create(
        create_valid_player_profile_input({
          player_id: "player_1",
          visibility: "public",
          status: "active",
        }),
      );
      await repository.create(
        create_valid_player_profile_input({
          player_id: "player_2",
          visibility: "public",
          status: "inactive",
        }),
      );

      const result = await repository.find_public_profiles();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items.length).toBe(1);
        expect(result.data.items[0].status).toBe("active");
      }
    });

    it("returns empty array when no public profiles exist", async () => {
      await repository.create(
        create_valid_player_profile_input({ visibility: "private" }),
      );

      const result = await repository.find_public_profiles();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items.length).toBe(0);
      }
    });

    it("supports pagination", async () => {
      for (let i = 1; i <= 5; i++) {
        await repository.create(
          create_valid_player_profile_input({
            player_id: `player_${i}`,
            visibility: "public",
          }),
        );
      }

      const result = await repository.find_public_profiles({
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
    it("filters by player_id", async () => {
      await repository.create(
        create_valid_player_profile_input({ player_id: "player_abc" }),
      );
      await repository.create(
        create_valid_player_profile_input({ player_id: "player_xyz" }),
      );

      const result = await repository.find_by_filter({
        player_id: "player_abc",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items.length).toBe(1);
        expect(result.data.items[0].player_id).toBe("player_abc");
      }
    });

    it("filters by visibility", async () => {
      await repository.create(
        create_valid_player_profile_input({ visibility: "public" }),
      );
      await repository.create(
        create_valid_player_profile_input({ visibility: "private" }),
      );
      await repository.create(
        create_valid_player_profile_input({ visibility: "public" }),
      );

      const result = await repository.find_by_filter({ visibility: "public" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items.length).toBe(2);
        expect(result.data.items.every((p) => p.visibility === "public")).toBe(
          true,
        );
      }
    });

    it("filters by status", async () => {
      await repository.create(
        create_valid_player_profile_input({ status: "active" }),
      );
      await repository.create(
        create_valid_player_profile_input({ status: "inactive" }),
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
        create_valid_player_profile_input({
          player_id: "player_1",
          visibility: "public",
          status: "active",
        }),
      );
      await repository.create(
        create_valid_player_profile_input({
          player_id: "player_2",
          visibility: "public",
          status: "inactive",
        }),
      );
      await repository.create(
        create_valid_player_profile_input({
          player_id: "player_3",
          visibility: "private",
          status: "active",
        }),
      );

      const result = await repository.find_by_filter({
        visibility: "public",
        status: "active",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items.length).toBe(1);
        expect(result.data.items[0].player_id).toBe("player_1");
      }
    });

    it("returns all profiles when no filter provided", async () => {
      await repository.create(create_valid_player_profile_input());
      await repository.create(create_valid_player_profile_input());

      const result = await repository.find_by_filter({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items.length).toBe(2);
      }
    });
  });

  describe("update", () => {
    it("updates profile fields", async () => {
      const create_result = await repository.create(
        create_valid_player_profile_input(),
      );
      expect(create_result.success).toBe(true);

      if (create_result.success) {
        const update_result = await repository.update(create_result.data.id, {
          profile_summary: "Updated summary",
          visibility: "public",
        });

        expect(update_result.success).toBe(true);
        if (update_result.success) {
          expect(update_result.data.profile_summary).toBe("Updated summary");
          expect(update_result.data.visibility).toBe("public");
          expect(update_result.data.player_id).toBe("player_123");
        }
      }
    });

    it("preserves player_id on update", async () => {
      const create_result = await repository.create(
        create_valid_player_profile_input({ player_id: "player_original" }),
      );
      expect(create_result.success).toBe(true);

      if (create_result.success) {
        const update_result = await repository.update(create_result.data.id, {
          profile_summary: "New summary",
        });

        expect(update_result.success).toBe(true);
        if (update_result.success) {
          expect(update_result.data.player_id).toBe("player_original");
        }
      }
    });
  });

  describe("delete_by_id", () => {
    it("deletes profile successfully", async () => {
      const create_result = await repository.create(
        create_valid_player_profile_input(),
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

    it("returns failure when deleting non-existent profile", async () => {
      const result = await repository.delete_by_id("nonexistent_id");

      expect(result.success).toBe(false);
    });
  });
});
