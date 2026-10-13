import { describe, expect, it } from "vitest";

import type { SidebarMenuGroup } from "$lib/core/interfaces/ports";
import { USER_ROLE_ORDER } from "$lib/core/interfaces/ports/external/iam/AuthenticationPort";

import {
  get_default_route_for_role,
  get_sidebar_menu_for_role,
} from "./LocalAuthorizationAdapter";

describe("get_sidebar_menu_for_role", () => {
  it("should return full menu for super_admin", () => {
    const menu = get_sidebar_menu_for_role("super_admin");

    expect(menu.length).toBeGreaterThan(0);
    const administration_group = menu.find(
      (group: SidebarMenuGroup) => group.group_name === "Administration",
    );
    expect(administration_group).toBeDefined();
  });

  it("should return team-focused menu for team_manager", () => {
    const menu = get_sidebar_menu_for_role("team_manager");

    const my_team_group = menu.find(
      (group: SidebarMenuGroup) => group.group_name === "My Team",
    );
    expect(my_team_group).toBeDefined();

    const organization_group = menu.find(
      (group: SidebarMenuGroup) => group.group_name === "Organization",
    );
    expect(Boolean(organization_group)).toBe(false);
  });

  it("should include Officials Performance in team_manager menu", () => {
    const menu = get_sidebar_menu_for_role("team_manager");

    const officials_group = menu.find(
      (group: SidebarMenuGroup) => group.group_name === "Officials",
    );
    expect(officials_group).toBeDefined();

    const performance_item = officials_group?.items.find(
      (item: { href: string }) => item.href === "/official-performance",
    );
    expect(performance_item).toBeDefined();
  });

  it("should return officials-focused menu for officials_manager", () => {
    const menu = get_sidebar_menu_for_role("officials_manager");

    const officials_group = menu.find(
      (group: SidebarMenuGroup) => group.group_name === "Officials",
    );
    expect(officials_group).toBeDefined();
  });

  it("should return player info menu for player", () => {
    const menu = get_sidebar_menu_for_role("player");

    const my_info_group = menu.find(
      (group: SidebarMenuGroup) => group.group_name === "My Info",
    );
    expect(my_info_group).toBeDefined();
  });

  it("should return public viewer menu with competition results and calendar", () => {
    const menu = get_sidebar_menu_for_role("public_viewer");

    expect(menu.length).toBeGreaterThan(0);

    const all_items = menu.flatMap((group: SidebarMenuGroup) => group.items);
    const hrefs = all_items.map((item: { href: string }) => item.href);

    expect(hrefs).toContain("/competition-results");
    expect(hrefs).toContain("/calendar");
  });

  it("should not include admin routes for public_viewer", () => {
    const menu = get_sidebar_menu_for_role("public_viewer");

    const administration_group = menu.find(
      (group: SidebarMenuGroup) => group.group_name === "Administration",
    );
    expect(Boolean(administration_group)).toBe(false);

    const all_items = menu.flatMap((group: SidebarMenuGroup) => group.items);
    const hrefs = all_items.map((item: { href: string }) => item.href);

    expect(hrefs).not.toContain("/system-users");
    expect(hrefs).not.toContain("/settings");
    expect(hrefs).not.toContain("/organizations");
  });
});

describe("get_default_route_for_role", () => {
  it("should return /competition-results for public_viewer", () => {
    expect(get_default_route_for_role("public_viewer")).toBe(
      "/competition-results",
    );
  });

  it("should return / for super_admin", () => {
    expect(get_default_route_for_role("super_admin")).toBe("/");
  });

  it("should return / for org_admin", () => {
    expect(get_default_route_for_role("org_admin")).toBe("/");
  });

  it("should return / for officials_manager", () => {
    expect(get_default_route_for_role("officials_manager")).toBe("/");
  });

  it("should return / for team_manager", () => {
    expect(get_default_route_for_role("team_manager")).toBe("/");
  });

  it("should return / for official", () => {
    expect(get_default_route_for_role("official")).toBe("/");
  });

  it("should return / for player", () => {
    expect(get_default_route_for_role("player")).toBe("/");
  });

  it("should return a defined route for every UserRole", () => {
    for (const role of USER_ROLE_ORDER) {
      const route = get_default_route_for_role(role);
      expect(typeof route).toBe("string");
      expect(route.startsWith("/")).toBe(true);
    }
  });
});
