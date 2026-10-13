import { describe, expect, it, vi } from "vitest";

import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import {
  load_profiles_from_repository,
  resolve_organization_names,
} from "./profileLoader";
import {
  create_mock_org_repository,
  create_mock_system_user_repository,
  create_mock_team_repository,
  create_test_system_user,
} from "./profileLoader.test_support";

describe("resolve_organization_names", () => {
  it("maps wildcard to All Organisations", async () => {
    const org_repo = create_mock_org_repository();

    const name_map = await resolve_organization_names(["*"], org_repo);

    expect(name_map.get("*")).toBe("All Organisations");
    expect(org_repo.find_by_ids).not.toHaveBeenCalled();
  });

  it("resolves organization names from repository", async () => {
    const org_repo = create_mock_org_repository([
      { id: "org_1", name: "Hockey Federation" },
      { id: "org_2", name: "Football League" },
    ]);

    const name_map = await resolve_organization_names(
      ["org_1", "org_2"],
      org_repo,
    );

    expect(name_map.get("org_1")).toBe("Hockey Federation");
    expect(name_map.get("org_2")).toBe("Football League");
  });

  it("deduplicates organization ids before lookup", async () => {
    const org_repo = create_mock_org_repository([
      { id: "org_1", name: "Hockey Federation" },
    ]);

    await resolve_organization_names(["org_1", "org_1", "org_1"], org_repo);

    expect(org_repo.find_by_ids).toHaveBeenCalledWith(["org_1"]);
  });

  it("handles repository failure gracefully", async () => {
    const org_repo = create_mock_org_repository();
    vi.mocked(org_repo.find_by_ids).mockResolvedValue(
      create_failure_result("Database error"),
    );

    const name_map = await resolve_organization_names(["org_1"], org_repo);

    expect(name_map.get("*")).toBe("All Organisations");
    expect(name_map.has("org_1")).toBe(false);
  });
});

describe("load_profiles_from_repository", () => {
  it("returns profiles with resolved organization names", async () => {
    const users = [
      create_test_system_user({
        id: "usr_1",
        first_name: "Admin",
        organization_id: "org_1",
        team_id: "team_1",
      }),
      create_test_system_user({
        id: "usr_2",
        first_name: "Manager",
        organization_id: "org_2",
        team_id: "team_2",
      }),
    ];

    const mock_user_repo = create_mock_system_user_repository(
      Promise.resolve(
        create_success_result({
          items: users,
          total_count: 2,
          page_number: 1,
          page_size: 100,
          total_pages: 1,
        }),
      ),
    );

    const mock_org_repo = create_mock_org_repository([
      { id: "org_1", name: "Hockey Federation" },
      { id: "org_2", name: "Football League" },
    ]);
    const mock_team_repo = create_mock_team_repository([
      { id: "team_1", name: "Kampala Cranes" },
      { id: "team_2", name: "Entebbe Sharks" },
    ]);

    const profiles = await load_profiles_from_repository(
      mock_user_repo,
      mock_org_repo,
      mock_team_repo,
    );

    expect(profiles).toHaveLength(2);
    expect(profiles[0].display_name).toBe("Admin Doe");
    expect(profiles[0].organization_name).toBe("Hockey Federation");
    expect(profiles[0].team_name).toBe("Kampala Cranes");
    expect(profiles[1].display_name).toBe("Manager Doe");
    expect(profiles[1].organization_name).toBe("Football League");
    expect(profiles[1].team_name).toBe("Entebbe Sharks");
  });

  it("returns empty array when repository call fails", async () => {
    const mock_user_repo = create_mock_system_user_repository(
      Promise.resolve(create_failure_result("Database error")),
    );
    const mock_org_repo = create_mock_org_repository();
    const mock_team_repo = create_mock_team_repository();

    const profiles = await load_profiles_from_repository(
      mock_user_repo,
      mock_org_repo,
      mock_team_repo,
    );

    expect(profiles).toEqual([]);
  });

  it("returns empty array when no users exist", async () => {
    const mock_user_repo = create_mock_system_user_repository(
      Promise.resolve(
        create_success_result({
          items: [],
          total_count: 0,
          page_number: 1,
          page_size: 100,
          total_pages: 0,
        }),
      ),
    );
    const mock_org_repo = create_mock_org_repository();
    const mock_team_repo = create_mock_team_repository();

    const profiles = await load_profiles_from_repository(
      mock_user_repo,
      mock_org_repo,
      mock_team_repo,
    );

    expect(profiles).toEqual([]);
  });
});
