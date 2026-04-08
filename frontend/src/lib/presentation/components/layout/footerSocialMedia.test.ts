import { describe, expect, it } from "vitest";

import {
  FOOTER_FALLBACK_SOCIAL_PLATFORMS,
  get_social_media_icon,
  get_social_media_label,
} from "./footerSocialMedia";

describe("footerSocialMedia", () => {
  it("returns known labels and icons for supported platforms", () => {
    expect(FOOTER_FALLBACK_SOCIAL_PLATFORMS).toEqual([
      "twitter",
      "github",
      "linkedin",
    ]);
    expect(get_social_media_label("github")).toBe("GitHub");
    expect(get_social_media_icon("github")).toContain("M10 0C4.477");
  });

  it("falls back gracefully for unknown platforms", () => {
    expect(get_social_media_label("mastodon")).toBe("mastodon");
    expect(get_social_media_icon("mastodon")).toBe("");
  });
});
