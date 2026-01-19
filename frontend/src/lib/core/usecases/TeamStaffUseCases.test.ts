import { describe, it, expect, vi, beforeEach } from "vitest";
import { create_team_staff_use_cases } from "./TeamStaffUseCases";
import type { TeamStaffRepository } from "../interfaces/adapters/TeamStaffRepository";
import type { TeamStaff, CreateTeamStaffInput } from "../entities/TeamStaff";

function create_mock_repository(): TeamStaffRepository {
  return {
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    delete_by_ids: vi.fn(),
    find_by_team: vi.fn(),
    find_by_role: vi.fn(),
    find_by_ids: vi.fn(),
    count: vi.fn(),
  };
}

function create_test_staff(overrides: Partial<TeamStaff> = {}): TeamStaff {
  return {
    id: "staff-123",
    first_name: "John",
    last_name: "Coach",
    email: "john@example.com",
    phone: "",
    date_of_birth: "",
    team_id: "team-123",
    role_id: "role-123",
    nationality: "",
    profile_image_url: "",
    employment_start_date: "",
    employment_end_date: null,
    emergency_contact_name: "",
    emergency_contact_phone: "",
    notes: "",
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

function create_valid_input(
  overrides: Partial<CreateTeamStaffInput> = {},
): CreateTeamStaffInput {
  return {
    first_name: "Jane",
    last_name: "Manager",
    email: "jane@example.com",
    phone: "",
    date_of_birth: "",
    team_id: "team-123",
    role_id: "role-456",
    nationality: "",
    profile_image_url: "",
    employment_start_date: "",
    employment_end_date: null,
    emergency_contact_name: "",
    emergency_contact_phone: "",
    notes: "",
    status: "active",
    ...overrides,
  };
}

describe("TeamStaffUseCases", () => {
  let mock_repository: TeamStaffRepository;
  let use_cases: ReturnType<typeof create_team_staff_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_team_staff_use_cases(mock_repository);
  });

  describe("list", () => {
    it("should return all staff when no filter", async () => {
      vi.mocked(mock_repository.find_all).mockResolvedValue({
        success: true,
        data: {
          items: [create_test_staff()],
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
    it("should return staff when found", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: create_test_staff(),
      });

      const result = await use_cases.get_by_id("staff-123");

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
        data: create_test_staff(),
      });

      const result = await use_cases.create(create_valid_input());

      expect(result.success).toBe(true);
    });

    it("should fail for empty first_name", async () => {
      const result = await use_cases.create(
        create_valid_input({ first_name: "" }),
      );

      expect(result.success).toBe(false);
    });

    it("should fail for empty team_id", async () => {
      const result = await use_cases.create(
        create_valid_input({ team_id: "" }),
      );

      expect(result.success).toBe(false);
    });
  });

  describe("update", () => {
    it("should update with valid input", async () => {
      vi.mocked(mock_repository.update).mockResolvedValue({
        success: true,
        data: create_test_staff(),
      });

      const result = await use_cases.update("staff-123", {
        first_name: "Updated",
      });

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.update("", { first_name: "Updated" });

      expect(result.success).toBe(false);
    });
  });

  describe("delete", () => {
    it("should delete by id", async () => {
      vi.mocked(mock_repository.delete_by_id).mockResolvedValue({
        success: true,
        data: true,
      });

      const result = await use_cases.delete("staff-123");

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.delete("");

      expect(result.success).toBe(false);
    });
  });

  describe("list_staff_by_team", () => {
    it("should return staff for team", async () => {
      vi.mocked(mock_repository.find_by_team).mockResolvedValue([
        create_test_staff(),
      ]);

      const result = await use_cases.list_staff_by_team("team-123");

      expect(result.success).toBe(true);
    });

    it("should fail for empty team_id", async () => {
      const result = await use_cases.list_staff_by_team("");

      expect(result.success).toBe(false);
    });
  });
});
