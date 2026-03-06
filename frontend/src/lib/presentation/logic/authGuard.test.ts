import { describe, it, expect, vi, beforeEach } from "vitest";

const { mock_repository, mock_org_repository } = vi.hoisted(() => {
  function create_test_system_users() {
    return [
      {
        id: "test-super-admin",
        first_name: "Super",
        last_name: "Admin",
        email: "admin@test.com",
        role: "super_admin" as const,
        status: "active" as const,
        organization_id: "*",
        team_id: "*",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "test-org-admin",
        first_name: "Organisation",
        last_name: "Admin",
        email: "orgadmin@test.com",
        role: "org_admin" as const,
        status: "active" as const,
        organization_id: "org_1",
        team_id: "*",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "test-officials-manager",
        first_name: "Officials",
        last_name: "Manager",
        email: "officials@test.com",
        role: "officials_manager" as const,
        status: "active" as const,
        organization_id: "org_1",
        team_id: "*",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "test-team-manager",
        first_name: "Team",
        last_name: "Manager",
        email: "manager@test.com",
        role: "team_manager" as const,
        status: "active" as const,
        organization_id: "org_1",
        team_id: "team_1",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "test-official",
        first_name: "Michael",
        last_name: "Anderson",
        email: "michael@test.com",
        role: "official" as const,
        status: "active" as const,
        organization_id: "org_1",
        team_id: "*",
        official_id: "official_1",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "test-player",
        first_name: "Denis",
        last_name: "Onyango",
        email: "denis@test.com",
        role: "player" as const,
        status: "active" as const,
        organization_id: "org_1",
        team_id: "team_1",
        player_id: "player_1",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  }

  return {
    mock_repository: {
      find_all: vi.fn().mockResolvedValue({
        success: true,
        data: {
          items: create_test_system_users(),
          total: 6,
          page: 1,
          page_size: 50,
        },
      }),
    },
    mock_org_repository: {
      find_by_ids: vi.fn().mockResolvedValue({
        success: true,
        data: [
          {
            id: "org_1",
            name: "Test Organisation",
            description: "",
            sport_id: "",
            founded_date: null,
            contact_email: "",
            contact_phone: "",
            address: "",
            website: "",
            status: "active",
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          },
        ],
      }),
    },
  };
});

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

vi.stubGlobal("navigator", {
  userAgent: "TestAgent/1.0",
});

vi.mock("$lib/adapters/initialization/brandingSyncService", () => ({
  sync_branding_with_profile: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("$lib/adapters/repositories/InBrowserSystemUserRepository", () => ({
  get_system_user_repository: vi.fn().mockReturnValue(mock_repository),
}));

vi.mock("$lib/adapters/repositories/InBrowserOrganizationRepository", () => ({
  get_organization_repository: vi.fn().mockReturnValue(mock_org_repository),
}));

import { goto } from "$app/navigation";
import {
  check_route_access,
  ensure_route_access,
  invalidate_route_access_cache,
  extract_route_base,
  is_route_in_accessible_set,
} from "./authGuard";
import { auth_store } from "../stores/auth";
import { get } from "svelte/store";

describe("authGuard", () => {
  beforeEach(async () => {
    vi.mocked(goto).mockClear();
    invalidate_route_access_cache();
    Object.keys(mock_local_storage).forEach(
      (key) => delete mock_local_storage[key],
    );
    await auth_store.initialize();
  });

  describe("check_route_access", () => {
    describe("without profile", () => {
      it("denies access when no profile is set", async () => {
        auth_store.logout();
        const initialize_spy = vi
          .spyOn(auth_store, "initialize")
          .mockResolvedValue();

        const result = await check_route_access("/teams");

        expect(result.allowed).toBe(false);
        expect(result.message).toContain("select a user profile");

        initialize_spy.mockRestore();
      });
    });

    describe("with super_admin profile", () => {
      beforeEach(async () => {
        const profiles = get(auth_store).available_profiles;
        const super_admin = profiles.find((p) => p.role === "super_admin");
        await auth_store.switch_profile(super_admin!.id);
      });

      it("allows access to /system-users", async () => {
        const result = await check_route_access("/system-users");
        expect(result.allowed).toBe(true);
      });

      it("allows access to /audit-logs", async () => {
        const result = await check_route_access("/audit-logs");
        expect(result.allowed).toBe(true);
      });

      it("allows access to /system-users", async () => {
        const result = await check_route_access("/system-users");
        expect(result.allowed).toBe(true);
      });

      it("allows access to /teams", async () => {
        const result = await check_route_access("/teams");
        expect(result.allowed).toBe(true);
      });

      it("allows access to /organizations", async () => {
        const result = await check_route_access("/organizations");
        expect(result.allowed).toBe(true);
      });
    });

    describe("with player profile", () => {
      beforeEach(async () => {
        const profiles = get(auth_store).available_profiles;
        const player = profiles.find((p) => p.role === "player");
        await auth_store.switch_profile(player!.id);
      });

      it("denies access to /settings", async () => {
        const result = await check_route_access("/settings");

        expect(result.allowed).toBe(false);
        expect(result.message).toContain("Player");
        expect(result.message).toContain("does not have access");
      });

      it("denies access to /audit-logs", async () => {
        const result = await check_route_access("/audit-logs");

        expect(result.allowed).toBe(false);
      });

      it("denies access to /system-users", async () => {
        const result = await check_route_access("/system-users");

        expect(result.allowed).toBe(false);
      });

      it("denies access to /teams", async () => {
        const result = await check_route_access("/teams");
        expect(result.allowed).toBe(false);
      });

      it("denies access to /sports", async () => {
        const result = await check_route_access("/sports");
        expect(result.allowed).toBe(false);
      });

      it("denies access to /competitions", async () => {
        const result = await check_route_access("/competitions");
        expect(result.allowed).toBe(false);
      });

      it("denies access to /player-profiles", async () => {
        const result = await check_route_access("/player-profiles");
        expect(result.allowed).toBe(false);
      });
    });

    describe("with team_manager profile", () => {
      beforeEach(async () => {
        const profiles = get(auth_store).available_profiles;
        const team_manager = profiles.find((p) => p.role === "team_manager");
        await auth_store.switch_profile(team_manager!.id);
      });

      it("denies access to /settings", async () => {
        const result = await check_route_access("/settings");
        expect(result.allowed).toBe(false);
      });

      it("denies access to /audit-logs", async () => {
        const result = await check_route_access("/audit-logs");
        expect(result.allowed).toBe(false);
      });

      it("denies access to /team-profiles", async () => {
        const result = await check_route_access("/team-profiles");
        expect(result.allowed).toBe(false);
      });

      it("allows access to /fixture-lineups", async () => {
        const result = await check_route_access("/fixture-lineups");
        expect(result.allowed).toBe(true);
      });

      it("allows access to /players", async () => {
        const result = await check_route_access("/players");
        expect(result.allowed).toBe(true);
      });

      it("allows access to /teams", async () => {
        const result = await check_route_access("/teams");
        expect(result.allowed).toBe(true);
      });
    });

    describe("with org_admin profile", () => {
      beforeEach(async () => {
        const profiles = get(auth_store).available_profiles;
        const org_admin = profiles.find((p) => p.role === "org_admin");
        await auth_store.switch_profile(org_admin!.id);
      });

      it("allows access to /settings", async () => {
        const result = await check_route_access("/settings");
        expect(result.allowed).toBe(true);
      });

      it("allows access to /audit-logs", async () => {
        const result = await check_route_access("/audit-logs");
        expect(result.allowed).toBe(true);
      });

      it("denies access to /system-users", async () => {
        const result = await check_route_access("/system-users");
        expect(result.allowed).toBe(false);
      });

      it("allows access to /competitions", async () => {
        const result = await check_route_access("/competitions");
        expect(result.allowed).toBe(true);
      });

      it("allows access to /venues", async () => {
        const result = await check_route_access("/venues");
        expect(result.allowed).toBe(true);
      });
    });
  });

  describe("ensure_route_access", () => {
    it("redirects to home when access is denied", async () => {
      const profiles = get(auth_store).available_profiles;
      const player = profiles.find((p) => p.role === "player");
      await auth_store.switch_profile(player!.id);

      await ensure_route_access("/settings");

      expect(vi.mocked(goto)).toHaveBeenCalledWith("/");
    });

    it("does not redirect when access is allowed", async () => {
      const profiles = get(auth_store).available_profiles;
      const super_admin = profiles.find((p) => p.role === "super_admin");
      await auth_store.switch_profile(super_admin!.id);

      await ensure_route_access("/system-users");

      expect(vi.mocked(goto)).not.toHaveBeenCalled();
    });

    it("returns false when access is denied", async () => {
      const profiles = get(auth_store).available_profiles;
      const player = profiles.find((p) => p.role === "player");
      await auth_store.switch_profile(player!.id);

      const result = await ensure_route_access("/settings");

      expect(result).toBe(false);
    });

    it("returns true when access is allowed", async () => {
      const profiles = get(auth_store).available_profiles;
      const super_admin = profiles.find((p) => p.role === "super_admin");
      await auth_store.switch_profile(super_admin!.id);

      const result = await ensure_route_access("/system-users");

      expect(result).toBe(true);
    });
  });

  describe("route access changes with profile switch", () => {
    it("denies then allows /system-users when switching from player to super_admin", async () => {
      const profiles = get(auth_store).available_profiles;
      const player = profiles.find((p) => p.role === "player");
      const super_admin = profiles.find((p) => p.role === "super_admin");

      await auth_store.switch_profile(player!.id);
      const player_result = await check_route_access("/system-users");
      expect(player_result.allowed).toBe(false);

      await auth_store.switch_profile(super_admin!.id);
      const admin_result = await check_route_access("/system-users");
      expect(admin_result.allowed).toBe(true);
    });

    it("allows then denies /audit-logs when switching from org_admin to team_manager", async () => {
      const profiles = get(auth_store).available_profiles;
      const org_admin = profiles.find((p) => p.role === "org_admin");
      const team_manager = profiles.find((p) => p.role === "team_manager");

      await auth_store.switch_profile(org_admin!.id);
      const admin_result = await check_route_access("/audit-logs");
      expect(admin_result.allowed).toBe(true);

      await auth_store.switch_profile(team_manager!.id);
      const manager_result = await check_route_access("/audit-logs");
      expect(manager_result.allowed).toBe(false);
    });
  });

  describe("extract_route_base", () => {
    it("returns / for empty pathname", () => {
      expect(extract_route_base("")).toBe("/");
    });

    it("returns / for root pathname", () => {
      expect(extract_route_base("/")).toBe("/");
    });

    it("returns /teams for /teams", () => {
      expect(extract_route_base("/teams")).toBe("/teams");
    });

    it("returns /teams for /teams/123", () => {
      expect(extract_route_base("/teams/123")).toBe("/teams");
    });

    it("returns /competitions for /competitions/create", () => {
      expect(extract_route_base("/competitions/create")).toBe("/competitions");
    });
  });

  describe("is_route_in_accessible_set", () => {
    const test_routes = new Set(["/teams", "/players", "/fixtures"]);

    it("returns true for root path", () => {
      expect(is_route_in_accessible_set("/", test_routes)).toBe(true);
    });

    it("returns true for empty path", () => {
      expect(is_route_in_accessible_set("", test_routes)).toBe(true);
    });

    it("returns true for exact match", () => {
      expect(is_route_in_accessible_set("/teams", test_routes)).toBe(true);
    });

    it("returns true for sub-route matching base", () => {
      expect(is_route_in_accessible_set("/teams/123", test_routes)).toBe(true);
    });

    it("returns false for route not in set", () => {
      expect(is_route_in_accessible_set("/settings", test_routes)).toBe(false);
    });

    it("returns false for sub-route of missing base", () => {
      expect(is_route_in_accessible_set("/settings/general", test_routes)).toBe(
        false,
      );
    });
  });

  describe("route access cache", () => {
    it("invalidate_route_access_cache returns false when no cache exists", () => {
      expect(invalidate_route_access_cache()).toBe(false);
    });

    it("invalidate_route_access_cache returns true after cache is populated", async () => {
      const profiles = get(auth_store).available_profiles;
      const super_admin = profiles.find((p) => p.role === "super_admin");
      await auth_store.switch_profile(super_admin!.id);

      await check_route_access("/teams");

      expect(invalidate_route_access_cache()).toBe(true);
    });

    it("cache auto-invalidates when role changes", async () => {
      const profiles = get(auth_store).available_profiles;
      const super_admin = profiles.find((p) => p.role === "super_admin");
      const player = profiles.find((p) => p.role === "player");

      await auth_store.switch_profile(super_admin!.id);
      const admin_result = await check_route_access("/system-users");
      expect(admin_result.allowed).toBe(true);

      await auth_store.switch_profile(player!.id);
      const player_result = await check_route_access("/system-users");
      expect(player_result.allowed).toBe(false);
    });
  });
});
