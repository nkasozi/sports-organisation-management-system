import { describe, expect, it, vi } from "vitest";

import type { TeamStaffRole } from "../entities/TeamStaffRole";
import { create_team_staff_use_cases } from "./TeamStaffUseCases";
import {
  create_mock_repository,
  create_mock_roles_repository,
  create_test_staff,
} from "./TeamStaffUseCases.test_support";

describe("TeamStaffUseCases team and role listing", () => {
  it("wraps team staff into a single page", async () => {
    const repository = create_mock_repository();
    const staff = [create_test_staff({ id: "s-1" }), create_test_staff()];
    vi.mocked(repository.find_by_team).mockResolvedValue({
      success: true,
      data: staff,
    });
    const use_cases = create_team_staff_use_cases(
      repository,
      create_mock_roles_repository(),
    );

    const result = await use_cases.list_staff_by_team("team-123");

    expect(result).toEqual({
      success: true,
      data: {
        items: staff,
        total_count: 2,
        page_number: 1,
        page_size: 2,
        total_pages: 1,
      },
    });
    expect(repository.find_by_team).toHaveBeenCalledWith("team-123");
    expect(repository.find_all).not.toHaveBeenCalled();
  });

  it("lists active staff roles", async () => {
    const roles_repository = create_mock_roles_repository();
    const roles = [{ id: "role-1" } as TeamStaffRole];
    vi.mocked(roles_repository.find_all).mockResolvedValue({
      success: true,
      data: {
        items: roles,
        total_count: 1,
        page_number: 1,
        page_size: 100,
        total_pages: 1,
      },
    });
    const use_cases = create_team_staff_use_cases(
      create_mock_repository(),
      roles_repository,
    );

    const result = await use_cases.list_staff_roles();

    expect(result).toEqual({ success: true, data: roles });
    expect(roles_repository.find_all).toHaveBeenCalledWith(
      { status: "active" },
      { page_size: 100 },
    );
  });
});
