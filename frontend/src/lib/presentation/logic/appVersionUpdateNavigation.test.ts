import { describe, expect, it } from "vitest";

import { should_reload_for_new_version } from "./appVersionUpdateNavigation";

describe("reloading into a new app version", () => {
  it("does a full page load on the next in-app navigation once a new version is out", () => {
    expect(
      should_reload_for_new_version({
        is_new_version_available: true,
        will_unload: false,
        has_target_url: true,
      }),
    ).toBe(true);
  });

  it("leaves navigation alone when nothing new is deployed", () => {
    expect(
      should_reload_for_new_version({
        is_new_version_available: false,
        will_unload: false,
        has_target_url: true,
      }),
    ).toBe(false);
  });

  it("does nothing when the page is already unloading or has no target", () => {
    expect(
      should_reload_for_new_version({
        is_new_version_available: true,
        will_unload: true,
        has_target_url: true,
      }),
    ).toBe(false);
    expect(
      should_reload_for_new_version({
        is_new_version_available: true,
        will_unload: false,
        has_target_url: false,
      }),
    ).toBe(false);
  });
});
