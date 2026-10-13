import { describe, expect, it } from "vitest";

import { create_success_result } from "$lib/core/types/Result";

import { load_profiles_from_repository } from "./profileLoader";
import {
  create_mock_org_repository,
  create_mock_system_user_repository,
  create_mock_team_repository,
  create_test_system_user,
} from "./profileLoader.test_support";

describe("load_profiles_from_repository", () => {
  it("preserves all user fields through conversion", async () => {
    const users = [
      create_test_system_user({
        id: "usr_player_1",
        first_name: "Denis",
        last_name: "Onyango",
        email: "denis@team.com",
        role: "player",
        organization_id: "org_hockey",
        team_id: "team_weatherhead",
        player_id: "player_99",
      }),
    ];

    const mock_user_repo = create_mock_system_user_repository(
      Promise.resolve(
        create_success_result({
          items: users,
          total_count: 1,
          page_number: 1,
          page_size: 100,
          total_pages: 1,
        }),
      ),
    );
    const mock_org_repo = create_mock_org_repository([
      { id: "org_hockey", name: "Hockey Association" },
    ]);
    const mock_team_repo = create_mock_team_repository([
      { id: "team_weatherhead", name: "Weatherhead Hockey Club" },
    ]);

    const profiles = await load_profiles_from_repository(
      mock_user_repo,
      mock_org_repo,
      mock_team_repo,
    );

    expect(profiles).toHaveLength(1);
    const profile = profiles[0];
    expect(profile.id).toBe("usr_player_1");
    expect(profile.display_name).toBe("Denis Onyango");
    expect(profile.email).toBe("denis@team.com");
    expect(profile.role).toBe("player");
    expect(profile.organization_id).toBe("org_hockey");
    expect(profile.organization_name).toBe("Hockey Association");
    expect(profile.team_id).toBe("team_weatherhead");
    expect(profile.team_name).toBe("Weatherhead Hockey Club");
    expect(profile.player_id).toBe("player_99");
  });

  it("resolves wildcard organization as All Organisations", async () => {
    const users = [
      create_test_system_user({
        id: "usr_1",
        organization_id: "*",
        role: "super_admin",
      }),
    ];

    const mock_user_repo = create_mock_system_user_repository(
      Promise.resolve(
        create_success_result({
          items: users,
          total_count: 1,
          page_number: 1,
          page_size: 100,
          total_pages: 1,
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

    expect(profiles[0].organization_name).toBe("All Organisations");
  });
});
