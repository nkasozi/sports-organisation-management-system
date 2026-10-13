import { describe, expect, it } from "vitest";

import {
  convert_system_user_to_profile,
  convert_system_users_to_profiles,
} from "./profileLoader";
import { create_test_system_user } from "./profileLoader.test_support";

describe("convert_system_user_to_profile", () => {
  it("maps all fields from system user to profile", () => {
    const system_user = create_test_system_user({
      id: "usr_1",
      first_name: "Jane",
      last_name: "Smith",
      email: "jane@example.com",
      role: "team_manager",
      organization_id: "org_99",
      team_id: "team_42",
      player_id: "player_7",
      official_id: "official_3",
    });

    const profile = convert_system_user_to_profile(
      system_user,
      "Test Organisation",
      "Test Team",
    );

    expect(profile.id).toBe("usr_1");
    expect(profile.display_name).toBe("Jane Smith");
    expect(profile.email).toBe("jane@example.com");
    expect(profile.role).toBe("team_manager");
    expect(profile.organization_id).toBe("org_99");
    expect(profile.organization_name).toBe("Test Organisation");
    expect(profile.team_id).toBe("team_42");
    expect(profile.team_name).toBe("Test Team");
    expect(profile.player_id).toBe("player_7");
    expect(profile.official_id).toBe("official_3");
  });

  it("sets team_id to empty string when system user has no team_id", () => {
    const system_user = create_test_system_user({ team_id: void 0 });

    const profile = convert_system_user_to_profile(system_user, "Org", "");

    expect(profile.team_id).toBe("");
  });

  it("concatenates first and last name for display_name", () => {
    const system_user = create_test_system_user({
      first_name: "Michael",
      last_name: "Anderson",
    });

    const profile = convert_system_user_to_profile(system_user, "Org", "");

    expect(profile.display_name).toBe("Michael Anderson");
  });
});

describe("convert_system_users_to_profiles", () => {
  it("converts multiple system users using organization name map", () => {
    const users = [
      create_test_system_user({
        id: "usr_1",
        first_name: "Alice",
        organization_id: "org_1",
        team_id: "team_1",
      }),
      create_test_system_user({
        id: "usr_2",
        first_name: "Bob",
        organization_id: "org_2",
        team_id: "team_2",
      }),
    ];

    const org_map = new Map([
      ["org_1", "Hockey Federation"],
      ["org_2", "Football League"],
    ]);
    const team_map = new Map([
      ["team_1", "Kampala Cranes"],
      ["team_2", "Entebbe Sharks"],
    ]);

    const profiles = convert_system_users_to_profiles(users, org_map, team_map);

    expect(profiles).toHaveLength(2);
    expect(profiles[0].organization_name).toBe("Hockey Federation");
    expect(profiles[0].team_name).toBe("Kampala Cranes");
    expect(profiles[1].organization_name).toBe("Football League");
    expect(profiles[1].team_name).toBe("Entebbe Sharks");
  });

  it("falls back to organization_id when name not in map", () => {
    const users = [
      create_test_system_user({
        id: "usr_1",
        organization_id: "org_unknown",
      }),
    ];

    const profiles = convert_system_users_to_profiles(
      users,
      new Map(),
      new Map(),
    );

    expect(profiles[0].organization_name).toBe("org_unknown");
    expect(profiles[0].team_name).toBe("");
  });

  it("includes all system users regardless of status", () => {
    const users = [
      create_test_system_user({ id: "usr_1", status: "active" }),
      create_test_system_user({ id: "usr_2", status: "inactive" }),
      create_test_system_user({ id: "usr_3", status: "active" }),
    ];

    const profiles = convert_system_users_to_profiles(
      users,
      new Map(),
      new Map(),
    );

    expect(profiles).toHaveLength(3);
    expect(profiles[0].id).toBe("usr_1");
    expect(profiles[1].id).toBe("usr_2");
    expect(profiles[2].id).toBe("usr_3");
  });

  it("returns empty array for empty input", () => {
    const profiles = convert_system_users_to_profiles([], new Map(), new Map());
    expect(profiles).toEqual([]);
  });
});
