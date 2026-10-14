import { describe, expect, it, vi } from "vitest";

import { reveal_page_after_initial_route_decision } from "./layoutNavigationGuard";

describe("reveal_page_after_initial_route_decision", () => {
  it("decides the initial route before the page is revealed", async () => {
    const call_order: string[] = [];
    const guard_initial_route = vi.fn(async () => {
      call_order.push("guard");
      return true;
    });
    const reveal_page = vi.fn(() => {
      call_order.push("reveal");
      return true;
    });

    const result = await reveal_page_after_initial_route_decision(
      { guard_initial_route, reveal_page },
      "/teams",
    );

    expect(result).toBe(true);
    expect(guard_initial_route).toHaveBeenCalledWith("/teams");
    expect(call_order).toEqual(["guard", "reveal"]);
  });

  it("still reveals the redirected page after a denied initial route", async () => {
    const reveal_page = vi.fn(() => true);

    const result = await reveal_page_after_initial_route_decision(
      { guard_initial_route: async () => false, reveal_page },
      "/audit-logs",
    );

    expect(result).toBe(false);
    expect(reveal_page).toHaveBeenCalledTimes(1);
  });
});
