import { describe, it, expect, vi, beforeEach } from "vitest";
import { create_organization_use_cases } from "./OrganizationUseCases";
import type { OrganizationRepository } from "../interfaces/adapters/OrganizationRepository";
import type {
  Organization,
  CreateOrganizationInput,
} from "../entities/Organization";

function create_mock_repository(): OrganizationRepository {
  return {
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    find_by_filter: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    delete_by_ids: vi.fn(),
    find_active_organizations: vi.fn(),
    find_by_ids: vi.fn(),
    count: vi.fn(),
  };
}

function create_test_organization(
  overrides: Partial<Organization> = {},
): Organization {
  return {
    id: "org-123",
    name: "Test Organization",
    description: "Test Description",
    sport_id: "sport-123",
    founded_date: "2020-01-01",
    contact_email: "test@example.com",
    contact_phone: "+256700000000",
    address: "123 Test Street",
    website: "https://test.com",
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

function create_valid_input(
  overrides: Partial<CreateOrganizationInput> = {},
): CreateOrganizationInput {
  return {
    name: "New Organization",
    description: "New Description",
    sport_id: "sport-123",
    founded_date: "2020-01-01",
    contact_email: "new@example.com",
    contact_phone: "+256700000001",
    address: "456 New Street",
    website: "https://new.com",
    status: "active",
    ...overrides,
  };
}

describe("OrganizationUseCases", () => {
  let mock_repository: OrganizationRepository;
  let use_cases: ReturnType<typeof create_organization_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_organization_use_cases(mock_repository);
  });

  describe("list", () => {
    it("should return all organizations when no filter provided", async () => {
      const organizations = [
        create_test_organization({ id: "1" }),
        create_test_organization({ id: "2" }),
      ];
      vi.mocked(mock_repository.find_all).mockResolvedValue({
        success: true,
        data: {
          items: organizations,
          total_count: 2,
          page_number: 1,
          page_size: 10,
          total_pages: 1,
        },
      });

      const result = await use_cases.list();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.total_count).toBe(2);
    });

    it("should apply filter when provided", async () => {
      const filter = { name_contains: "Uganda" };
      vi.mocked(mock_repository.find_by_filter).mockResolvedValue({
        success: true,
        data: {
          items: [create_test_organization()],
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
      expect(result.success).toBe(true);
    });

    it("should return failure when repository fails", async () => {
      vi.mocked(mock_repository.find_all).mockResolvedValue({
        success: false,
        error: "Database error",
      });

      const result = await use_cases.list();

      expect(result.success).toBe(false);
      expect(result.error_message).toBe("Database error");
    });
  });

  describe("get_by_id", () => {
    it("should return organization when found", async () => {
      const organization = create_test_organization();
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: organization,
      });

      const result = await use_cases.get_by_id("org-123");

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe("Test Organization");
    });

    it("should return failure for empty id", async () => {
      const result = await use_cases.get_by_id("");

      expect(result.success).toBe(false);
      expect(result.error_message).toBe("Organization ID is required");
    });

    it("should return failure for whitespace id", async () => {
      const result = await use_cases.get_by_id("   ");

      expect(result.success).toBe(false);
      expect(result.error_message).toBe("Organization ID is required");
    });

    it("should return failure when not found", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: false,
        error: "Not found",
      });

      const result = await use_cases.get_by_id("nonexistent");

      expect(result.success).toBe(false);
    });
  });

  describe("create", () => {
    it("should create organization with valid input", async () => {
      const input = create_valid_input();
      const created = create_test_organization({ name: input.name });
      vi.mocked(mock_repository.create).mockResolvedValue({
        success: true,
        data: created,
      });

      const result = await use_cases.create(input);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe("New Organization");
    });

    it("should fail validation for empty name", async () => {
      const input = create_valid_input({ name: "" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      expect(result.error_message).toContain("name");
    });

    it("should fail validation for short name", async () => {
      const input = create_valid_input({ name: "A" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
    });

    it("should return failure when repository fails", async () => {
      const input = create_valid_input();
      vi.mocked(mock_repository.create).mockResolvedValue({
        success: false,
        error: "Database error",
      });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      expect(result.error_message).toBe("Database error");
    });
  });

  describe("update", () => {
    it("should update organization with valid input", async () => {
      const updated = create_test_organization({ name: "Updated Name" });
      vi.mocked(mock_repository.update).mockResolvedValue({
        success: true,
        data: updated,
      });

      const result = await use_cases.update("org-123", {
        name: "Updated Name",
      });

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe("Updated Name");
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.update("", { name: "Updated" });

      expect(result.success).toBe(false);
      expect(result.error_message).toBe("Organization ID is required");
    });

    it("should return failure when repository fails", async () => {
      vi.mocked(mock_repository.update).mockResolvedValue({
        success: false,
        error: "Update failed",
      });

      const result = await use_cases.update("org-123", { name: "Updated" });

      expect(result.success).toBe(false);
    });
  });

  describe("delete", () => {
    it("should delete organization by id", async () => {
      vi.mocked(mock_repository.delete_by_id).mockResolvedValue({
        success: true,
        data: true,
      });

      const result = await use_cases.delete("org-123");

      expect(result.success).toBe(true);
      expect(mock_repository.delete_by_id).toHaveBeenCalledWith("org-123");
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.delete("");

      expect(result.success).toBe(false);
      expect(result.error_message).toBe("Organization ID is required");
    });
  });

  describe("delete_organizations", () => {
    it("should delete multiple organizations", async () => {
      vi.mocked(mock_repository.delete_by_ids).mockResolvedValue({
        success: true,
        data: 3,
      });

      const result = await use_cases.delete_organizations(["1", "2", "3"]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(3);
      }
    });

    it("should fail for empty array", async () => {
      const result = await use_cases.delete_organizations([]);

      expect(result.success).toBe(false);
    });
  });
});
