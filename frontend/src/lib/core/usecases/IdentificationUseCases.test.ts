import { describe, it, expect, vi, beforeEach } from "vitest";
import { create_identification_use_cases } from "./IdentificationUseCases";
import type { IdentificationRepository } from "../interfaces/adapters/IdentificationRepository";
import type {
  Identification,
  CreateIdentificationInput,
} from "../entities/Identification";

function create_mock_repository(): IdentificationRepository {
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
    find_by_holder: vi.fn(),
  };
}

function create_test_identification(
  overrides: Partial<Identification> = {},
): Identification {
  return {
    id: "id-123",
    holder_type: "player",
    holder_id: "player-123",
    identification_type_id: "type-123",
    identifier_value: "ID12345678",
    document_image_url: "",
    issue_date: "2024-01-01",
    expiry_date: "2029-01-01",
    notes: "",
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

function create_valid_input(
  overrides: Partial<CreateIdentificationInput> = {},
): CreateIdentificationInput {
  return {
    holder_type: "player",
    holder_id: "player-456",
    identification_type_id: "type-456",
    identifier_value: "ID98765432",
    document_image_url: "",
    issue_date: "2024-06-01",
    expiry_date: "2029-06-01",
    notes: "",
    status: "active",
    ...overrides,
  };
}

describe("IdentificationUseCases", () => {
  let mock_repository: IdentificationRepository;
  let use_cases: ReturnType<typeof create_identification_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_identification_use_cases(mock_repository);
  });

  describe("list", () => {
    it("should return all identifications", async () => {
      vi.mocked(mock_repository.find_all).mockResolvedValue({
        success: true,
        data: {
          items: [create_test_identification()],
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
    it("should return identification when found", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: create_test_identification(),
      });

      const result = await use_cases.get_by_id("id-123");

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
        data: create_test_identification(),
      });

      const result = await use_cases.create(create_valid_input());

      expect(result.success).toBe(true);
    });

    it("should fail for empty entity_id", async () => {
      const result = await use_cases.create(
        create_valid_input({ holder_id: "" }),
      );

      expect(result.success).toBe(false);
    });

    it("should fail for empty value", async () => {
      const result = await use_cases.create(
        create_valid_input({ identifier_value: "" }),
      );

      expect(result.success).toBe(false);
    });
  });

  describe("update", () => {
    it("should update with valid input", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: create_test_identification(),
      });
      vi.mocked(mock_repository.update).mockResolvedValue({
        success: true,
        data: create_test_identification(),
      });

      const result = await use_cases.update("id-123", {
        identifier_value: "NEWID123",
      });

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.update("", {
        identifier_value: "NEWID123",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("delete", () => {
    it("should delete by id", async () => {
      vi.mocked(mock_repository.delete_by_id).mockResolvedValue({
        success: true,
        data: true,
      });

      const result = await use_cases.delete("id-123");

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.delete("");

      expect(result.success).toBe(false);
    });
  });

  describe("list_identifications_by_entity", () => {
    it("should return identifications for entity", async () => {
      vi.mocked(mock_repository.find_by_holder).mockResolvedValue({
        success: true,
        data: {
          items: [create_test_identification()],
          total_count: 1,
          page_number: 1,
          page_size: 10,
          total_pages: 1,
        },
      });

      const result = await use_cases.list_identifications_by_entity(
        "player",
        "player-123",
      );

      expect(result.success).toBe(true);
    });

    it("should fail for empty entity_id", async () => {
      const result = await use_cases.list_identifications_by_entity(
        "player",
        "",
      );

      expect(result.success).toBe(false);
    });
  });
});
