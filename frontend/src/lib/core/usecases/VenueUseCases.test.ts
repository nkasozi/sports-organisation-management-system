import { beforeEach, describe, expect, it, vi } from "vitest";

import type { VenueRepository } from "../interfaces/ports";
import { create_venue_use_cases } from "./VenueUseCases";
import {
  create_mock_repository,
  create_test_venue,
  create_valid_input,
} from "./VenueUseCases.test_support";

describe("VenueUseCases", () => {
  let mock_repository: VenueRepository;
  let use_cases: ReturnType<typeof create_venue_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_venue_use_cases(mock_repository);
  });

  describe("list", () => {
    it("should return all venues when no filter", async () => {
      const venues = [
        create_test_venue({ id: "1" }),
        create_test_venue({ id: "2" }),
      ];
      vi.mocked(mock_repository.find_all).mockResolvedValue({
        success: true,
        data: {
          items: venues,
          total_count: 2,
          page_number: 1,
          page_size: 10,
          total_pages: 1,
        },
      });

      const result = await use_cases.list();

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.items).toHaveLength(2);
    });

    it("should apply filter when provided", async () => {
      const filter = { city: "Kampala" };
      vi.mocked(mock_repository.find_all).mockResolvedValue({
        success: true,
        data: {
          items: [create_test_venue()],
          total_count: 1,
          page_number: 1,
          page_size: 10,
          total_pages: 1,
        },
      });

      const result = await use_cases.list(filter);

      expect(result.success).toBe(true);
      expect(mock_repository.find_all).toHaveBeenCalledWith(filter, {});
    });
  });

  describe("get_by_id", () => {
    it("should return venue when found", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: create_test_venue(),
      });

      const result = await use_cases.get_by_id("venue-123");

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data?.name).toBe("National Stadium");
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.get_by_id("");

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Venue ID is required");
    });
  });

  describe("create", () => {
    it("should create with valid input", async () => {
      const input = create_valid_input();
      vi.mocked(mock_repository.create).mockResolvedValue({
        success: true,
        data: create_test_venue({ name: input.name }),
      });

      const result = await use_cases.create(input);

      expect(result.success).toBe(true);
    });

    it("should fail for empty name", async () => {
      const input = create_valid_input({ name: "" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
    });

    it("should fail for invalid website and image urls", async () => {
      const input = create_valid_input({
        website: "javascript:alert(1)",
        image_url: "data:text/html;base64,PGgxPkJhZDwvaDE+",
      });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("Website URL is invalid");
      expect(result.error).toContain("Image URL is invalid");
    });
  });

  describe("update", () => {
    it("should update with valid input", async () => {
      vi.mocked(mock_repository.update).mockResolvedValue({
        success: true,
        data: create_test_venue({ name: "Updated Venue" }),
      });

      const result = await use_cases.update("venue-123", {
        name: "Updated Venue",
      });

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.update("", { name: "Updated" });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Venue ID is required");
    });
  });

  describe("delete", () => {
    it("should delete by id", async () => {
      vi.mocked(mock_repository.delete_by_id).mockResolvedValue({
        success: true,
        data: true,
      });

      const result = await use_cases.delete("venue-123");

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.delete("");

      expect(result.success).toBe(false);
    });
  });

  describe("delete_venues", () => {
    it("should delete multiple", async () => {
      vi.mocked(mock_repository.delete_by_ids).mockResolvedValue({
        success: true,
        data: 2,
      });

      const result = await use_cases.delete_venues(["1", "2"]);

      expect(result.success).toBe(true);
    });

    it("should fail for empty array", async () => {
      const result = await use_cases.delete_venues([]);

      expect(result.success).toBe(false);
    });
  });
});
