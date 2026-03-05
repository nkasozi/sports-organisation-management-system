import { describe, it, expect, vi, beforeEach } from "vitest";

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

import { goto } from "$app/navigation";
import { check_route_access, ensure_route_access } from "./authGuard";
import { auth_store } from "../stores/auth";
import { get } from "svelte/store";

describe("authGuard", () => {
  beforeEach(async () => {
    vi.mocked(goto).mockClear();
    Object.keys(mock_local_storage).forEach(
      (key) => delete mock_local_storage[key],
    );
    await auth_store.initialize();
  });

  describe("check_route_access", () => {
    describe("without profile", () => {
      it("denies access when no profile is set", async () => {
        auth_store.logout();
        vi.spyOn(auth_store, "initialize").mockResolvedValue();

        const result = await check_route_access("/teams");

        expect(result.allowed).toBe(false);
        expect(result.message).toContain("select a user profile");
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
});
