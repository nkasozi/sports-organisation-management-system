import { describe, it, expect, vi, beforeEach } from "vitest";
import { create_gender_use_cases } from "./GenderUseCases";
import type { GenderRepository } from "../interfaces/ports";
import type { Gender, CreateGenderInput } from "../entities/Gender";

function create_mock_repository(): GenderRepository {
  return {
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    find_by_ids: vi.fn(),
    find_by_filter: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    find_active_genders: vi.fn(),
    delete_by_ids: vi.fn(),
    count: vi.fn(),
  };
}

function create_test_gender(overrides: Partial<Gender> = {}): Gender {
  return {
    id: "gender-123",
    name: "Male",
    description: "Male gender",
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

function create_valid_input(
  overrides: Partial<CreateGenderInput> = {},
): CreateGenderInput {
  return {
    name: "Female",
    description: "Female gender",
    status: "active",
    ...overrides,
  };
}

describe("GenderUseCases", () => {
  let mock_repository: GenderRepository;
  let use_cases: ReturnType<typeof create_gender_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_gender_use_cases(mock_repository);
  });

  describe("list", () => {
    it("should return all genders", async () => {
      vi.mocked(mock_repository.find_all).mockResolvedValue({
        success: true,
        data: {
          items: [create_test_gender()],
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
    it("should return gender when found", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: create_test_gender(),
      });

      const result = await use_cases.get_by_id("gender-123");

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
        data: create_test_gender(),
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
        data: create_test_gender(),
      });
      vi.mocked(mock_repository.update).mockResolvedValue({
        success: true,
        data: create_test_gender(),
      });

      const result = await use_cases.update("gender-123", {
        name: "Female",
      });

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.update("", { name: "Female" });

      expect(result.success).toBe(false);
    });
  });

  describe("delete", () => {
    it("should delete by id", async () => {
      vi.mocked(mock_repository.delete_by_id).mockResolvedValue({
        success: true,
        data: true,
      });

      const result = await use_cases.delete("gender-123");

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.delete("");

      expect(result.success).toBe(false);
    });
  });
});
