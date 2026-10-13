import { describe, expect, it } from "vitest";

import {
  add_social_media_link,
  is_allowed_sync_interval,
  remove_social_media_link,
  update_social_media_platform,
  update_social_media_url,
} from "./settingsPageState";

describe("settings social media helpers", () => {
  it("adds the next available social platform", () => {
    const result = add_social_media_link([
      { platform: "twitter", url: "https://x.com/league" },
    ]);

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.data).toEqual([
      { platform: "twitter", url: "https://x.com/league" },
      { platform: "facebook", url: "" },
    ]);
  });

  it("rejects duplicate social platform changes", () => {
    const result = update_social_media_platform(
      [
        { platform: "twitter", url: "https://x.com/league" },
        { platform: "facebook", url: "https://facebook.com/league" },
      ],
      "twitter",
      "facebook",
    );

    expect(result).toEqual({
      success: false,
      error_message: "This platform is already added",
    });
  });

  it("updates and removes social links", () => {
    const updated_links = update_social_media_url(
      [{ platform: "twitter", url: "" }],
      "twitter",
      "https://x.com/league",
    );

    expect(updated_links).toEqual([
      { platform: "twitter", url: "https://x.com/league" },
    ]);

    expect(remove_social_media_link(updated_links, "twitter")).toEqual([]);
  });
});

describe("settings sync interval helpers", () => {
  it("accepts only allowed sync intervals", () => {
    expect(is_allowed_sync_interval(600_000)).toBe(true);
    expect(is_allowed_sync_interval(123_456)).toBe(false);
  });
});
