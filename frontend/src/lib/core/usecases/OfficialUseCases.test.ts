import { describe, it, expect, vi, beforeEach } from "vitest";
import { create_official_use_cases } from "./OfficialUseCases";
import type { OfficialRepository } from "../interfaces/adapters/OfficialRepository";
import type { Official, CreateOfficialInput } from "../entities/Official";

function create_mock_repository(): OfficialRepository {
  return {
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    find_by_filter: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    delete_by_ids: vi.fn(),
    find_by_organization: vi.fn(),
    find_active_officials: vi.fn(),
    find_available_for_date: vi.fn(),
    find_by_ids: vi.fn(),
    count: vi.fn(),
  };
}

function create_test_official(overrides: Partial<Official> = {}): Official {
  return {
    id: "official-123",
    first_name: "John",
    last_name: "Referee",
    email: "john@example.com",
    phone: "+256700123456",
    date_of_birth: "1985-05-15",
    organization_id: "org-123",
    years_of_experience: 5,
    nationality: "Uganda",
    profile_image_url: "",
    emergency_contact_name: "Jane Doe",
    emergency_contact_phone: "+256700000001",
    notes: "",
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

function create_valid_input(
  overrides: Partial<CreateOfficialInput> = {},
): CreateOfficialInput {
  return {
    first_name: "John",
    last_name: "Referee",
    email: "john@example.com",
    phone: "+256700123456",
    date_of_birth: "1985-05-15",
    organization_id: "org-123",
    years_of_experience: 5,
    nationality: "Uganda",
    profile_image_url: "",
    emergency_contact_name: "Jane Doe",
    emergency_contact_phone: "+256700000001",
    notes: "",
    status: "active",
    ...overrides,
  };
}

describe("OfficialUseCases", () => {
  let mock_repository: OfficialRepository;
  let use_cases: ReturnType<typeof create_official_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_official_use_cases(mock_repository);
  });

  describe("list", () => {
    it("should return all officials when no filter", async () => {
      const officials = [
        create_test_official({ id: "1" }),
        create_test_official({ id: "2" }),
      ];
      vi.mocked(mock_repository.find_all).mockResolvedValue({
        success: true,
        data: {
          items: officials,
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
      const filter = { organization_id: "org-123" };
      vi.mocked(mock_repository.find_by_filter).mockResolvedValue({
        success: true,
        data: {
          items: [create_test_official()],
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
    it("should return official when found", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: create_test_official(),
      });

      const result = await use_cases.get_by_id("official-123");

      expect(result.success).toBe(true);
      expect(result.data?.first_name).toBe("John");
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.get_by_id("");

      expect(result.success).toBe(false);
      expect(result.error_message).toBe("Official ID is required");
    });
  });

  describe("create", () => {
    it("should create with valid input", async () => {
      const input = create_valid_input();
      vi.mocked(mock_repository.create).mockResolvedValue({
        success: true,
        data: create_test_official(),
      });

      const result = await use_cases.create(input);

      expect(result.success).toBe(true);
    });

    it("should fail for empty first_name", async () => {
      const input = create_valid_input({ first_name: "" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
    });

    it("should fail for empty last_name", async () => {
      const input = create_valid_input({ last_name: "" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
    });
  });

  describe("update", () => {
    it("should update with valid input", async () => {
      vi.mocked(mock_repository.update).mockResolvedValue({
        success: true,
        data: create_test_official({ first_name: "Updated" }),
      });

      const result = await use_cases.update("official-123", {
        first_name: "Updated",
      });

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.update("", { first_name: "Updated" });

      expect(result.success).toBe(false);
      expect(result.error_message).toBe("Official ID is required");
    });
  });

  describe("delete", () => {
    it("should delete by id", async () => {
      vi.mocked(mock_repository.delete_by_id).mockResolvedValue({
        success: true,
        data: true,
      });

      const result = await use_cases.delete("official-123");

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.delete("");

      expect(result.success).toBe(false);
    });
  });

  describe("delete_officials", () => {
    it("should delete multiple", async () => {
      vi.mocked(mock_repository.delete_by_ids).mockResolvedValue({
        success: true,
        data: 2,
      });

      const result = await use_cases.delete_officials(["1", "2"]);

      expect(result.success).toBe(true);
    });

    it("should fail for empty array", async () => {
      const result = await use_cases.delete_officials([]);

      expect(result.success).toBe(false);
    });
  });
});
