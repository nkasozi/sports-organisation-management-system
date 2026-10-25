import { describe, expect, it } from "vitest";

import { should_reload_across_auth_boundary } from "./authBoundaryNavigation";

function reloads(
  from_path: string,
  to_path: string,
  will_unload = false,
): boolean {
  return should_reload_across_auth_boundary({
    from_path,
    to_path,
    will_unload,
  });
}

describe("navigation into or out of sign-in loads the page fresh", () => {
  it("reloads when moving from an app page to sign-in and back", () => {
    expect(reloads("/competition-results", "/sign-in")).toBe(true);
    expect(reloads("/", "/sign-in/factor-one")).toBe(true);
    expect(reloads("/sign-in", "/")).toBe(true);
  });

  it("stays in the app for ordinary page changes", () => {
    expect(reloads("/", "/fixtures")).toBe(false);
    expect(reloads("/sign-in", "/sign-in/factor-one")).toBe(false);
  });

  it("does nothing when the browser is already leaving or there is no target", () => {
    expect(reloads("/", "/sign-in", true)).toBe(false);
    expect(reloads("/", "")).toBe(false);
  });
});
