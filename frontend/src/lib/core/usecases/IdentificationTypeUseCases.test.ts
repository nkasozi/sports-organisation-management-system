import { describe, it, expect, vi, beforeEach } from "vitest";
import { create_identification_type_use_cases } from "./IdentificationTypeUseCases";
import type { IdentificationTypeRepository } from "../interfaces/adapters/IdentificationTypeRepository";
import type {
  IdentificationType,
  CreateIdentificationTypeInput,
} from "../entities/IdentificationType";

function create_mock_repository(): IdentificationTypeRepository {
  return {
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    find_by_ids: vi.fn(),
    find_by_filter: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    find_active_types: vi.fn(),
    delete_by_ids: vi.fn(),
    count: vi.fn(),
  };
}

function create_test_type(
  overrides: Partial<IdentificationType> = {},
): IdentificationType {
  return {
    id: "type-123",
    name: "National ID",
    identifier_field_label: "ID Number",
    description: "Government issued national identification",
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

function create_valid_input(
  overrides: Partial<CreateIdentificationTypeInput> = {},
): CreateIdentificationTypeInput {
  return {
    name: "Passport",
    identifier_field_label: "Passport Number",
    description: "International passport",
    status: "active",
    ...overrides,
  };
}

describe("IdentificationTypeUseCases", () => {
  let mock_repository: IdentificationTypeRepository;
  let use_cases: ReturnType<typeof create_identification_type_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_identification_type_use_cases(mock_repository);
  });

  describe("list", () => {
    it("should return all identification types", async () => {
      vi.mocked(mock_repository.find_all).mockResolvedValue({
        success: true,
        data: {
          items: [create_test_type()],
          total_count: 1,
          page_number: 1,
          page_size: 10,
          total_pages: 1,
        },
      });

      const result = await use_cases.list();

      expect(result.success).toBe(true);
    });
  });

  describe("get_by_id", () => {
    it("should return type when found", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: create_test_type(),
      });

      const result = await use_cases.get_by_id("type-123");

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.get_by_id("");

      expect(result.success).toBe(false);
    });
  });

  describe("create", () => {
    it("should create with valid input", async () => {
      vi.mocked(mock_repository.create).mockResolvedValue({
        success: true,
        data: create_test_type(),
      });

      const result = await use_cases.create(create_valid_input());

      expect(result.success).toBe(true);
    });

    it("should fail for empty name", async () => {
      const result = await use_cases.create(create_valid_input({ name: "" }));

      expect(result.success).toBe(false);
    });
  });

  describe("update", () => {
    it("should update with valid input", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: create_test_type(),
      });
      vi.mocked(mock_repository.update).mockResolvedValue({
        success: true,
        data: create_test_type(),
      });

      const result = await use_cases.update("type-123", {
        name: "Driver License",
      });

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.update("", { name: "Driver License" });

      expect(result.success).toBe(false);
    });
  });

  describe("delete", () => {
    it("should delete by id", async () => {
      vi.mocked(mock_repository.delete_by_id).mockResolvedValue({
        success: true,
        data: true,
      });

      const result = await use_cases.delete("type-123");

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.delete("");

      expect(result.success).toBe(false);
    });
  });

  describe("list_types_by_sport", () => {
    it("should return types for sport", async () => {
      vi.mocked(mock_repository.find_all).mockResolvedValue({
        success: true,
        data: {
          items: [create_test_type()],
          total_count: 1,
          page_number: 1,
          page_size: 10,
          total_pages: 1,
        },
      });

      const result = await use_cases.list_types_by_sport("sport-123");

      expect(result.success).toBe(true);
    });

    it("should fail for empty sport_id", async () => {
      const result = await use_cases.list_types_by_sport("");

      expect(result.success).toBe(false);
    });
  });
});
