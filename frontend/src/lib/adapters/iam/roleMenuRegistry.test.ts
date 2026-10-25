import { describe, expect, it } from "vitest";

import {
  can_role_access_route,
  get_sidebar_menu_for_role,
} from "./roleMenuRegistry";

const HOW_IT_WORKS = "/how-it-works";

function menu_hrefs(
  role: Parameters<typeof get_sidebar_menu_for_role>[0],
): string[] {
  return get_sidebar_menu_for_role(role).flatMap((group) =>
    group.items.map((item) => item.href),
  );
}

describe("How It Works menu entry", () => {
  it("is offered to people who run or take part in the organization", () => {
    for (const role of [
      "super_admin",
      "org_admin",
      "officials_manager",
      "team_manager",
      "official",
      "player",
    ] as const) {
      expect(menu_hrefs(role), role).toContain(HOW_IT_WORKS);
      expect(can_role_access_route(role, HOW_IT_WORKS).allowed, role).toBe(
        true,
      );
    }
  });

  it("is hidden from and closed to public viewers", () => {
    expect(menu_hrefs("public_viewer")).not.toContain(HOW_IT_WORKS);
    expect(can_role_access_route("public_viewer", HOW_IT_WORKS).allowed).toBe(
      false,
    );
  });
});
