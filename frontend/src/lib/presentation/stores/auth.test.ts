import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { get } from "svelte/store";
import type { UserProfile } from "./auth";

const mock_local_storage: Record<string, string> = {};

vi.stubGlobal("localStorage", {
  getItem: (key: string) => mock_local_storage[key] || null,
  setItem: (key: string, value: string) => {
    mock_local_storage[key] = value;
  },
  removeItem: (key: string) => {
    delete mock_local_storage[key];
  },
  clear: () => {
    Object.keys(mock_local_storage).forEach(
      (key) => delete mock_local_storage[key],
    );
  },
});

vi.mock("$app/environment", () => ({
  browser: true,
}));

vi.mock("$app/navigation", () => ({
  goto: vi.fn(),
}));

vi.mock("$lib/adapters/initialization/brandingSyncService", () => ({
  sync_branding_with_profile: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("$lib/infrastructure/sync/convexSyncService", () => ({
  get_sync_manager: () => ({
    get_convex_client: () => ({
      query: vi.fn().mockResolvedValue({
        success: true,
        data: { email: "admin@test.com", role: "super_admin" },
      }),
      mutation: vi.fn(),
    }),
  }),
}));

vi.mock("$lib/adapters/iam/clerkAuthService", () => {
  const make_readable = <T>(value: T) => ({
    subscribe: (subscriber: (next_value: T) => void) => {
      subscriber(value);
      return () => {};
    },
  });
  return {
    is_clerk_loaded: make_readable(true),
    is_signed_in: make_readable(true),
    clerk_session: make_readable({
      is_loaded: true,
      is_signed_in: true,
      user: { email_address: "admin@test.com" },
      session_id: "test-session",
    }),
  };
});

function create_test_profiles(): UserProfile[] {
  return [
    {
      id: "test-super-admin",
      display_name: "Super Admin",
      email: "admin@test.com",
      role: "super_admin",
      organization_id: "*",
      organization_name: "All Organisations",
      team_id: "*",
    },
    {
      id: "test-org-admin",
      display_name: "Organisation Admin",
      email: "orgadmin@test.com",
      role: "org_admin",
      organization_id: "org_1",
      organization_name: "Test Organisation",
      team_id: "*",
    },
    {
      id: "test-officials-manager",
      display_name: "Officials Manager",
      email: "officials@test.com",
      role: "officials_manager",
      organization_id: "org_1",
      organization_name: "Test Organisation",
      team_id: "*",
    },
    {
      id: "test-team-manager",
      display_name: "Team Manager",
      email: "manager@test.com",
      role: "team_manager",
      organization_id: "org_1",
      organization_name: "Test Organisation",
      team_id: "team_1",
    },
    {
      id: "test-official",
      display_name: "Michael Anderson",
      email: "michael@test.com",
      role: "official",
      organization_id: "org_1",
      organization_name: "Test Organisation",
      team_id: "*",
      official_id: "official_1",
    },
    {
      id: "test-player",
      display_name: "Denis Onyango",
      email: "denis@test.com",
      role: "player",
      organization_id: "org_1",
      organization_name: "Test Organisation",
      team_id: "team_1",
      player_id: "player_1",
    },
  ];
}

vi.mock("./profileLoader", () => ({
  load_profiles_from_repository: vi.fn().mockImplementation(() => {
    return Promise.resolve(create_test_profiles());
  }),
}));

import {
  auth_store,
  sidebar_menu_items,
  current_user_role,
  current_user_role_display,
  current_profile_display_name,
  can_switch_profiles,
} from "./auth";
import { get_sidebar_menu_for_role } from "$lib/adapters/iam/LocalAuthorizationAdapter";
import type { UserRole } from "$lib/core/interfaces/ports";

describe("auth_store integration", () => {
  beforeEach(async () => {
    Object.keys(mock_local_storage).forEach(
      (key) => delete mock_local_storage[key],
    );
    await auth_store.initialize();
  });

  afterEach(() => {
    auth_store.logout();
  });

  describe("sidebar_menu_items derived store", () => {
    it("returns empty array when no profile is set", () => {
      auth_store.logout();
      const menu = get(sidebar_menu_items);
      expect(menu).toEqual([]);
    });

    it("returns menu items for super_admin profile", async () => {
      const profiles = get(auth_store).available_profiles;
      const super_admin_profile = profiles.find(
        (p) => p.role === "super_admin",
      );
      expect(super_admin_profile).toBeDefined();

      await auth_store.switch_profile(super_admin_profile!.id);

      const menu = get(sidebar_menu_items);
      const expected_menu = get_sidebar_menu_for_role("super_admin");

      expect(menu.length).toBe(expected_menu.length);
      expect(menu).toEqual(expected_menu);
    });

    it("returns different menu items for player profile", async () => {
      const profiles = get(auth_store).available_profiles;
      const player_profile = profiles.find((p) => p.role === "player");
      expect(player_profile).toBeDefined();

      await auth_store.switch_profile(player_profile!.id);

      const menu = get(sidebar_menu_items);
      const expected_menu = get_sidebar_menu_for_role("player");

      expect(menu).toEqual(expected_menu);
    });

    it("updates menu when profile is switched from super_admin to player", async () => {
      const profiles = get(auth_store).available_profiles;
      const super_admin_profile = profiles.find(
        (p) => p.role === "super_admin",
      );
      const player_profile = profiles.find((p) => p.role === "player");

      await auth_store.switch_profile(super_admin_profile!.id);
      const super_admin_menu = get(sidebar_menu_items);
      const super_admin_menu_length = super_admin_menu.length;

      await auth_store.switch_profile(player_profile!.id);
      const player_menu = get(sidebar_menu_items);
      const player_menu_length = player_menu.length;

      expect(super_admin_menu_length).toBeGreaterThan(0);
      expect(player_menu_length).toBeGreaterThan(0);
    });

    it("super_admin menu includes settings-related items that player menu does not", async () => {
      const profiles = get(auth_store).available_profiles;
      const super_admin_profile = profiles.find(
        (p) => p.role === "super_admin",
      );
      const player_profile = profiles.find((p) => p.role === "player");

      await auth_store.switch_profile(super_admin_profile!.id);
      const super_admin_items = get(sidebar_menu_items).flatMap((g) => g.items);

      await auth_store.switch_profile(player_profile!.id);
      const player_items = get(sidebar_menu_items).flatMap((g) => g.items);

      const super_admin_has_settings = super_admin_items.some(
        (item) => item.href === "/settings" || item.href === "/system-users",
      );
      const player_has_settings = player_items.some(
        (item) => item.href === "/settings" || item.href === "/system-users",
      );

      expect(super_admin_has_settings).toBe(true);
      expect(player_has_settings).toBe(false);
    });
  });

  describe("current_user_role derived store", () => {
    it("returns null when no profile is set", () => {
      auth_store.logout();
      const role = get(current_user_role);
      expect(role).toBeNull();
    });

    it("returns correct role after profile switch", async () => {
      const profiles = get(auth_store).available_profiles;
      const team_manager_profile = profiles.find(
        (p) => p.role === "team_manager",
      );

      await auth_store.switch_profile(team_manager_profile!.id);
      const role = get(current_user_role);

      expect(role).toBe("team_manager");
    });

    it("updates role when switching between profiles", async () => {
      const profiles = get(auth_store).available_profiles;
      const super_admin_profile = profiles.find(
        (p) => p.role === "super_admin",
      );
      const player_profile = profiles.find((p) => p.role === "player");

      await auth_store.switch_profile(super_admin_profile!.id);
      expect(get(current_user_role)).toBe("super_admin");

      await auth_store.switch_profile(player_profile!.id);
      expect(get(current_user_role)).toBe("player");
    });
  });

  describe("current_user_role_display derived store", () => {
    it("returns Unknown when no profile is set", () => {
      auth_store.logout();
      const display = get(current_user_role_display);
      expect(display).toBe("Unknown");
    });

    it("returns human-readable role name", async () => {
      const profiles = get(auth_store).available_profiles;
      const super_admin_profile = profiles.find(
        (p) => p.role === "super_admin",
      );

      await auth_store.switch_profile(super_admin_profile!.id);
      const display = get(current_user_role_display);

      expect(display).toBe("Super Admin");
    });
  });

  describe("current_profile_display_name derived store", () => {
    it("returns Guest when no profile is set", () => {
      auth_store.logout();
      const name = get(current_profile_display_name);
      expect(name).toBe("Guest");
    });

    it("returns profile display name after switch", async () => {
      const profiles = get(auth_store).available_profiles;
      const player_profile = profiles.find((p) => p.role === "player");

      await auth_store.switch_profile(player_profile!.id);
      const name = get(current_profile_display_name);

      expect(name).toBe(player_profile!.display_name);
    });
  });

  describe("available_profiles", () => {
    it("contains all expected roles", () => {
      const profiles = get(auth_store).available_profiles;
      const roles = profiles.map((p) => p.role);

      expect(roles).toContain("super_admin");
      expect(roles).toContain("org_admin");
      expect(roles).toContain("officials_manager");
      expect(roles).toContain("team_manager");
      expect(roles).toContain("official");
      expect(roles).toContain("player");
    });

    it("each profile has required fields", () => {
      const profiles = get(auth_store).available_profiles;

      for (const profile of profiles) {
        expect(profile.id).toBeDefined();
        expect(profile.display_name).toBeDefined();
        expect(profile.email).toBeDefined();
        expect(profile.role).toBeDefined();
        expect(profile.organization_id).toBeDefined();
        expect(profile.team_id).toBeDefined();
      }
    });
  });

  describe("switch_profile", () => {
    it("returns true for valid profile id", async () => {
      const profiles = get(auth_store).available_profiles;
      const result = await auth_store.switch_profile(profiles[0].id);
      expect(result).toBe(true);
    });

    it("returns false for invalid profile id", async () => {
      const result = await auth_store.switch_profile("non-existent-profile-id");
      expect(result).toBe(false);
    });

    it("updates current_profile in state", async () => {
      const profiles = get(auth_store).available_profiles;
      const target_profile = profiles.find((p) => p.role === "official");

      await auth_store.switch_profile(target_profile!.id);
      const state = get(auth_store);

      expect(state.current_profile).toBeDefined();
      expect(state.current_profile!.id).toBe(target_profile!.id);
      expect(state.current_profile!.role).toBe("official");
    });
  });

  describe("get_authorization_level", () => {
    it("returns authorization map for entity type", async () => {
      const profiles = get(auth_store).available_profiles;
      const super_admin_profile = profiles.find(
        (p) => p.role === "super_admin",
      );

      await auth_store.switch_profile(super_admin_profile!.id);
      const auth_level = auth_store.get_authorization_level("team");

      expect(auth_level.entity_type).toBe("team");
      expect(auth_level.authorizations).toBeDefined();
    });

    it("super_admin has all CRUD permissions for teams", async () => {
      const profiles = get(auth_store).available_profiles;
      const super_admin_profile = profiles.find(
        (p) => p.role === "super_admin",
      );

      await auth_store.switch_profile(super_admin_profile!.id);
      const auth_level = auth_store.get_authorization_level("team");

      expect(auth_level.authorizations.get("create")).toBe("full");
      expect(auth_level.authorizations.get("list")).toBe("full");
      expect(auth_level.authorizations.get("edit")).toBe("full");
      expect(auth_level.authorizations.get("delete")).toBe("full");
    });

    it("player cannot create/delete teams but can view", async () => {
      const profiles = get(auth_store).available_profiles;
      const player_profile = profiles.find((p) => p.role === "player");

      await auth_store.switch_profile(player_profile!.id);
      const auth_level = auth_store.get_authorization_level("team");

      expect(auth_level.authorizations.get("create")).toBe("none");
      expect(auth_level.authorizations.get("list")).toBe("full");
      expect(auth_level.authorizations.get("delete")).toBe("none");
    });
  });
  describe("can_switch_profiles derived store", () => {
    it("returns false when no profile is set", () => {
      auth_store.logout();
      expect(get(can_switch_profiles)).toBe(false);
    });

    it("returns true when current profile is super_admin", async () => {
      const profiles = get(auth_store).available_profiles;
      const super_admin_profile = profiles.find(
        (p) => p.role === "super_admin",
      );
      await auth_store.switch_profile(super_admin_profile!.id);
      expect(get(can_switch_profiles)).toBe(true);
    });

    it("returns true when not signed in (public_viewer demo mode)", async () => {
      const profiles = get(auth_store).available_profiles;
      const public_viewer_profile = profiles.find(
        (p) => p.role === "public_viewer",
      );
      await auth_store.switch_profile(public_viewer_profile!.id);
      expect(get(can_switch_profiles)).toBe(true);
    });

    it("returns false for org_admin", async () => {
      const profiles = get(auth_store).available_profiles;
      const org_admin_profile = profiles.find((p) => p.role === "org_admin");
      await auth_store.switch_profile(org_admin_profile!.id);
      expect(get(can_switch_profiles)).toBe(false);
    });

    it("returns false for team_manager", async () => {
      const profiles = get(auth_store).available_profiles;
      const team_manager_profile = profiles.find(
        (p) => p.role === "team_manager",
      );
      await auth_store.switch_profile(team_manager_profile!.id);
      expect(get(can_switch_profiles)).toBe(false);
    });

    it("returns false for player", async () => {
      const profiles = get(auth_store).available_profiles;
      const player_profile = profiles.find((p) => p.role === "player");
      await auth_store.switch_profile(player_profile!.id);
      expect(get(can_switch_profiles)).toBe(false);
    });

    it("returns false for official", async () => {
      const profiles = get(auth_store).available_profiles;
      const official_profile = profiles.find((p) => p.role === "official");
      await auth_store.switch_profile(official_profile!.id);
      expect(get(can_switch_profiles)).toBe(false);
    });

    it("updates when switching from super_admin to player", async () => {
      const profiles = get(auth_store).available_profiles;
      const super_admin_profile = profiles.find(
        (p) => p.role === "super_admin",
      );
      const player_profile = profiles.find((p) => p.role === "player");

      await auth_store.switch_profile(super_admin_profile!.id);
      expect(get(can_switch_profiles)).toBe(true);

      await auth_store.switch_profile(player_profile!.id);
      expect(get(can_switch_profiles)).toBe(false);
    });
  });
});

describe("auth_store persistence", () => {
  beforeEach(() => {
    Object.keys(mock_local_storage).forEach(
      (key) => delete mock_local_storage[key],
    );
  });

  it("saves profile id to localStorage on switch", async () => {
    await auth_store.initialize();
    const profiles = get(auth_store).available_profiles;

    await auth_store.switch_profile(profiles[0].id);

    expect(mock_local_storage["sports-org-current-profile-id"]).toBe(
      profiles[0].id,
    );
  });

  it("saves token to localStorage on switch", async () => {
    await auth_store.initialize();
    const profiles = get(auth_store).available_profiles;

    await auth_store.switch_profile(profiles[0].id);

    expect(mock_local_storage["sports-org-auth-token"]).toBeDefined();
  });

  it("clears localStorage on logout", async () => {
    await auth_store.initialize();
    const profiles = get(auth_store).available_profiles;
    await auth_store.switch_profile(profiles[0].id);

    auth_store.logout();

    expect(mock_local_storage["sports-org-current-profile-id"]).toBeUndefined();
    expect(mock_local_storage["sports-org-auth-token"]).toBeUndefined();
  });
});
