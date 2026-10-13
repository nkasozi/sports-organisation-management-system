import { describe, expect, it } from "vitest";

import { is_navigation_item_active } from "./layoutNavigationConstants";

describe("is_navigation_item_active", () => {
  it.each([
    ["/", "/", true],
    ["/", "/teams", false],
    ["/teams", "/teams", true],
    ["/teams", "/teams/123", true],
    ["/teams", "/teams-archive", false],
  ])("item %s on path %s is active=%s", (item_href, path, expected) => {
    expect(is_navigation_item_active(item_href, path)).toBe(expected);
  });
});
