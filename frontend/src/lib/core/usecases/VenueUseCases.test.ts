import { describe, it, expect, vi, beforeEach } from "vitest";
import { create_venue_use_cases } from "./VenueUseCases";
import type { VenueRepository } from "../interfaces/adapters/VenueRepository";
import type { Venue, CreateVenueInput } from "../entities/Venue";

function create_mock_repository(): VenueRepository {
  return {
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    find_by_ids: vi.fn(),
    find_by_filter: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    delete_by_ids: vi.fn(),
    count: vi.fn(),
    find_active_venues: vi.fn(),
  };
}

function create_test_venue(overrides: Partial<Venue> = {}): Venue {
  return {
    id: "venue-123",
    name: "National Stadium",
    short_name: "Nat Stadium",
    address: "123 Main Street",
    city: "Kampala",
    country: "Uganda",
    capacity: 50000,
    surface_type: "grass",
    has_lighting: true,
    has_parking: true,
    contact_email: "venue@example.com",
    contact_phone: "256123456789",
    website: "https://venue.example.com",
    image_url: "https://example.com/image.jpg",
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

function create_valid_input(
  overrides: Partial<CreateVenueInput> = {},
): CreateVenueInput {
  return {
    name: "New Stadium",
    short_name: "New Stad",
    address: "456 Sports Ave",
    city: "Kampala",
    country: "Uganda",
    capacity: 30000,
    surface_type: "grass",
    has_lighting: true,
    has_parking: true,
    contact_email: "newvenue@example.com",
    contact_phone: "256987654321",
    website: "https://newvenue.example.com",
    image_url: "https://example.com/new.jpg",
    status: "active",
    ...overrides,
  };
}

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
      expect(result.data).toHaveLength(2);
    });

    it("should apply filter when provided", async () => {
      const filter = { city: "Kampala" };
      vi.mocked(mock_repository.find_by_filter).mockResolvedValue({
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

      expect(mock_repository.find_by_filter).toHaveBeenCalledWith(
        filter,
        undefined,
      );
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
      expect(result.data?.name).toBe("National Stadium");
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.get_by_id("");

      expect(result.success).toBe(false);
      expect(result.error_message).toBe("Venue ID is required");
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
      expect(result.error_message).toBe("Venue ID is required");
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
