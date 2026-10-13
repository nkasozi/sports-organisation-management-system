import { describe, expect, it } from "vitest";

import { get_platform_icon } from "./ProfileLink";

describe("ProfileLink", () => {
  describe("get_platform_icon", () => {
    it("returns svg path for twitter", () => {
      const icon = get_platform_icon("twitter");
      expect(icon).toBeTruthy();
      expect(icon.length).toBeGreaterThan(0);
    });

    it("returns svg path for instagram", () => {
      const icon = get_platform_icon("instagram");
      expect(icon).toBeTruthy();
      expect(icon.length).toBeGreaterThan(0);
    });

    it("returns svg path for facebook", () => {
      const icon = get_platform_icon("facebook");
      expect(icon).toBeTruthy();
      expect(icon.length).toBeGreaterThan(0);
    });

    it("returns svg path for linkedin", () => {
      const icon = get_platform_icon("linkedin");
      expect(icon).toBeTruthy();
      expect(icon.length).toBeGreaterThan(0);
    });

    it("returns svg path for youtube", () => {
      const icon = get_platform_icon("youtube");
      expect(icon).toBeTruthy();
      expect(icon.length).toBeGreaterThan(0);
    });

    it("returns svg path for tiktok", () => {
      const icon = get_platform_icon("tiktok");
      expect(icon).toBeTruthy();
      expect(icon.length).toBeGreaterThan(0);
    });

    it("returns svg path for twitch", () => {
      const icon = get_platform_icon("twitch");
      expect(icon).toBeTruthy();
      expect(icon.length).toBeGreaterThan(0);
    });

    it("returns svg path for vimeo", () => {
      const icon = get_platform_icon("vimeo");
      expect(icon).toBeTruthy();
      expect(icon.length).toBeGreaterThan(0);
    });

    it("returns svg path for snapchat", () => {
      const icon = get_platform_icon("snapchat");
      expect(icon).toBeTruthy();
      expect(icon.length).toBeGreaterThan(0);
    });

    it("returns svg path for threads", () => {
      const icon = get_platform_icon("threads");
      expect(icon).toBeTruthy();
      expect(icon.length).toBeGreaterThan(0);
    });

    it("returns svg path for website", () => {
      const icon = get_platform_icon("website");
      expect(icon).toBeTruthy();
      expect(icon.length).toBeGreaterThan(0);
    });

    it("handles case insensitivity", () => {
      const lowercase_icon = get_platform_icon("twitter");
      const uppercase_icon = get_platform_icon("TWITTER");
      const mixedcase_icon = get_platform_icon("TwItTeR");

      expect(uppercase_icon).toBe(lowercase_icon);
      expect(mixedcase_icon).toBe(lowercase_icon);
    });

    it("returns other icon for unknown platform", () => {
      const icon = get_platform_icon("unknown_platform");
      expect(icon).toBeTruthy();
      expect(icon).toBe(get_platform_icon("other"));
    });

    it("returns other icon for empty platform", () => {
      const icon = get_platform_icon("");
      expect(icon).toBeTruthy();
      expect(icon).toBe(get_platform_icon("other"));
    });
  });
});
