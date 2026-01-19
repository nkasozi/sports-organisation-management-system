import { describe, it, expect, vi, beforeEach } from "vitest";
import { create_fixture_official_use_cases } from "./FixtureOfficialUseCases";
import type { FixtureOfficialRepository } from "../interfaces/adapters/FixtureOfficialRepository";
import type {
  FixtureOfficial,
  CreateFixtureOfficialInput,
} from "../entities/FixtureOfficial";

function create_mock_repository(): FixtureOfficialRepository {
  return {
    create_fixture_official: vi.fn(),
    get_fixture_official_by_id: vi.fn(),
    update_fixture_official: vi.fn(),
    delete_fixture_official: vi.fn(),
    find_by_filter: vi.fn(),
    get_officials_for_fixture: vi.fn(),
    get_fixtures_for_official: vi.fn(),
    get_official_assignment_for_fixture: vi.fn(),
  };
}

function create_test_fixture_official(
  overrides: Partial<FixtureOfficial> = {},
): FixtureOfficial {
  return {
    id: "fixture-official-123",
    fixture_id: "fixture-123",
    official_id: "official-123",
    role_id: "role-123",
    assignment_notes: "Head referee for the match",
    confirmation_status: "confirmed",
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

function create_valid_input(
  overrides: Partial<CreateFixtureOfficialInput> = {},
): CreateFixtureOfficialInput {
  return {
    fixture_id: "fixture-456",
    official_id: "official-456",
    role_id: "role-456",
    assignment_notes: "Assistant referee",
    confirmation_status: "pending",
    status: "active",
    ...overrides,
  };
}

describe("FixtureOfficialUseCases", () => {
  let mock_repository: FixtureOfficialRepository;
  let use_cases: ReturnType<typeof create_fixture_official_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_fixture_official_use_cases(mock_repository);
  });

  describe("list", () => {
    it("should return all fixture officials when no filter", async () => {
      vi.mocked(mock_repository.find_by_filter).mockResolvedValue({
        success: true,
        data: [create_test_fixture_official()],
        total_count: 1,
      });

      const result = await use_cases.list();

      expect(result.success).toBe(true);
      expect(mock_repository.find_by_filter).toHaveBeenCalledWith(undefined, {
        page: 1,
        page_size: 50,
      });
    });

    it("should pass filter to repository", async () => {
      vi.mocked(mock_repository.find_by_filter).mockResolvedValue({
        success: true,
        data: [],
        total_count: 0,
      });

      await use_cases.list({ fixture_id: "fixture-123" });

      expect(mock_repository.find_by_filter).toHaveBeenCalledWith(
        { fixture_id: "fixture-123" },
        { page: 1, page_size: 50 },
      );
    });
  });

  describe("get_by_id", () => {
    it("should return fixture official when found", async () => {
      vi.mocked(mock_repository.get_fixture_official_by_id).mockResolvedValue({
        success: true,
        data: create_test_fixture_official(),
      });

      const result = await use_cases.get_by_id("fixture-official-123");

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.get_by_id("");

      expect(result.success).toBe(false);
      expect(result.error_message).toBe("FixtureOfficial ID is required");
    });

    it("should fail for whitespace-only id", async () => {
      const result = await use_cases.get_by_id("   ");

      expect(result.success).toBe(false);
      expect(result.error_message).toBe("FixtureOfficial ID is required");
    });
  });

  describe("create", () => {
    it("should create with valid input", async () => {
      vi.mocked(mock_repository.find_by_filter).mockResolvedValue({
        success: true,
        data: [],
        total_count: 0,
      });
      vi.mocked(
        mock_repository.get_official_assignment_for_fixture,
      ).mockResolvedValue({
        success: false,
        error_message: "Not found",
      });
      vi.mocked(mock_repository.create_fixture_official).mockResolvedValue({
        success: true,
        data: create_test_fixture_official(),
      });

      const result = await use_cases.create(create_valid_input());

      expect(result.success).toBe(true);
    });

    it("should fail for empty fixture_id", async () => {
      const result = await use_cases.create(
        create_valid_input({ fixture_id: "" }),
      );

      expect(result.success).toBe(false);
      expect(result.error_message).toBe("Fixture ID is required");
    });

    it("should fail for empty official_id", async () => {
      const result = await use_cases.create(
        create_valid_input({ official_id: "" }),
      );

      expect(result.success).toBe(false);
      expect(result.error_message).toBe("Official ID is required");
    });

    it("should fail for empty role_id", async () => {
      const result = await use_cases.create(
        create_valid_input({ role_id: "" }),
      );

      expect(result.success).toBe(false);
      expect(result.error_message).toBe("Role ID is required");
    });

    it("should fail if role is already assigned to another official for this fixture", async () => {
      vi.mocked(mock_repository.find_by_filter).mockResolvedValue({
        success: true,
        data: [
          create_test_fixture_official({
            fixture_id: "fixture-456",
            role_id: "role-456",
            official_id: "different-official-123",
          }),
        ],
        total_count: 1,
      });

      const result = await use_cases.create(create_valid_input());

      expect(result.success).toBe(false);
      expect(result.error_message).toBe(
        "This role is already assigned to another official for this fixture",
      );
    });

    it("should fail if official is already assigned to fixture", async () => {
      vi.mocked(mock_repository.find_by_filter).mockResolvedValue({
        success: true,
        data: [],
        total_count: 0,
      });
      vi.mocked(
        mock_repository.get_official_assignment_for_fixture,
      ).mockResolvedValue({
        success: true,
        data: create_test_fixture_official(),
      });

      const result = await use_cases.create(create_valid_input());

      expect(result.success).toBe(false);
      expect(result.error_message).toBe(
        "This official is already assigned to this fixture",
      );
    });
  });

  describe("update", () => {
    it("should update with valid input", async () => {
      vi.mocked(mock_repository.get_fixture_official_by_id).mockResolvedValue({
        success: true,
        data: create_test_fixture_official(),
      });
      vi.mocked(mock_repository.find_by_filter).mockResolvedValue({
        success: true,
        data: [],
        total_count: 0,
      });
      vi.mocked(mock_repository.update_fixture_official).mockResolvedValue({
        success: true,
        data: create_test_fixture_official({ role_id: "role-new" }),
      });

      const result = await use_cases.update("fixture-official-123", {
        role_id: "role-new",
      });

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.update("", { role_id: "role-new" });

      expect(result.success).toBe(false);
      expect(result.error_message).toBe("FixtureOfficial ID is required");
    });

    it("should fail when fixture official not found", async () => {
      vi.mocked(mock_repository.get_fixture_official_by_id).mockResolvedValue({
        success: false,
        error_message: "Not found",
      });

      const result = await use_cases.update("fixture-official-123", {
        role_id: "role-new",
      });

      expect(result.success).toBe(false);
      expect(result.error_message).toBe(
        "Fixture official assignment not found",
      );
    });

    it("should fail if new role is already assigned to another official for this fixture", async () => {
      vi.mocked(mock_repository.get_fixture_official_by_id).mockResolvedValue({
        success: true,
        data: create_test_fixture_official({
          id: "fixture-official-123",
          fixture_id: "fixture-456",
          role_id: "role-old",
        }),
      });
      vi.mocked(mock_repository.find_by_filter).mockResolvedValue({
        success: true,
        data: [
          create_test_fixture_official({
            id: "different-assignment-789",
            fixture_id: "fixture-456",
            role_id: "role-new",
            official_id: "different-official-999",
          }),
        ],
        total_count: 1,
      });

      const result = await use_cases.update("fixture-official-123", {
        role_id: "role-new",
      });

      expect(result.success).toBe(false);
      expect(result.error_message).toBe(
        "This role is already assigned to another official for this fixture",
      );
    });
  });

  describe("delete", () => {
    it("should delete by id", async () => {
      vi.mocked(mock_repository.get_fixture_official_by_id).mockResolvedValue({
        success: true,
        data: create_test_fixture_official(),
      });
      vi.mocked(mock_repository.delete_fixture_official).mockResolvedValue({
        success: true,
        data: true,
      });

      const result = await use_cases.delete("fixture-official-123");

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.delete("");

      expect(result.success).toBe(false);
      expect(result.error_message).toBe("FixtureOfficial ID is required");
    });

    it("should fail when fixture official not found", async () => {
      vi.mocked(mock_repository.get_fixture_official_by_id).mockResolvedValue({
        success: false,
        error_message: "Not found",
      });

      const result = await use_cases.delete("fixture-official-123");

      expect(result.success).toBe(false);
      expect(result.error_message).toBe(
        "Fixture official assignment not found",
      );
    });
  });

  describe("list_officials_for_fixture", () => {
    it("should return officials for a fixture", async () => {
      vi.mocked(mock_repository.get_officials_for_fixture).mockResolvedValue({
        success: true,
        data: [create_test_fixture_official()],
        total_count: 1,
      });

      const result = await use_cases.list_officials_for_fixture("fixture-123");

      expect(result.success).toBe(true);
      expect(mock_repository.get_officials_for_fixture).toHaveBeenCalledWith(
        "fixture-123",
      );
    });

    it("should fail for empty fixture_id", async () => {
      const result = await use_cases.list_officials_for_fixture("");

      expect(result.success).toBe(false);
      expect(result.error_message).toBe("Fixture ID is required");
    });
  });

  describe("list_fixtures_for_official", () => {
    it("should return fixtures for an official", async () => {
      vi.mocked(mock_repository.get_fixtures_for_official).mockResolvedValue({
        success: true,
        data: [create_test_fixture_official()],
        total_count: 1,
      });

      const result = await use_cases.list_fixtures_for_official("official-123");

      expect(result.success).toBe(true);
      expect(mock_repository.get_fixtures_for_official).toHaveBeenCalledWith(
        "official-123",
      );
    });

    it("should fail for empty official_id", async () => {
      const result = await use_cases.list_fixtures_for_official("");

      expect(result.success).toBe(false);
      expect(result.error_message).toBe("Official ID is required");
    });
  });

  describe("confirm_assignment", () => {
    it("should confirm an assignment", async () => {
      vi.mocked(mock_repository.get_fixture_official_by_id).mockResolvedValue({
        success: true,
        data: create_test_fixture_official({ confirmation_status: "pending" }),
      });
      vi.mocked(mock_repository.update_fixture_official).mockResolvedValue({
        success: true,
        data: create_test_fixture_official({
          confirmation_status: "confirmed",
        }),
      });

      const result = await use_cases.confirm_assignment("fixture-official-123");

      expect(result.success).toBe(true);
      expect(mock_repository.update_fixture_official).toHaveBeenCalledWith(
        "fixture-official-123",
        { confirmation_status: "confirmed" },
      );
    });
  });

  describe("decline_assignment", () => {
    it("should decline an assignment", async () => {
      vi.mocked(mock_repository.get_fixture_official_by_id).mockResolvedValue({
        success: true,
        data: create_test_fixture_official({ confirmation_status: "pending" }),
      });
      vi.mocked(mock_repository.update_fixture_official).mockResolvedValue({
        success: true,
        data: create_test_fixture_official({ confirmation_status: "declined" }),
      });

      const result = await use_cases.decline_assignment("fixture-official-123");

      expect(result.success).toBe(true);
      expect(mock_repository.update_fixture_official).toHaveBeenCalledWith(
        "fixture-official-123",
        { confirmation_status: "declined" },
      );
    });
  });
});
