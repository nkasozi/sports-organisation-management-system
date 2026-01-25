import { describe, expect, it } from "vitest";
import {
  validate_profile_link_input,
  create_empty_profile_link_input,
  get_platform_icon,
} from "./ProfileLink";

describe("ProfileLink", () => {
  describe("create_empty_profile_link_input", () => {
    it("returns empty input with default values", () => {
      const input = create_empty_profile_link_input();

      expect(input.profile_id).toBe("");
      expect(input.platform).toBe("");
      expect(input.title).toBe("");
      expect(input.url).toBe("");
      expect(input.display_order).toBe(0);
      expect(input.status).toBe("active");
    });

    it("accepts profile_id parameter", () => {
      const input = create_empty_profile_link_input("profile_123");

      expect(input.profile_id).toBe("profile_123");
    });
  });

  describe("validate_profile_link_input", () => {
    it("requires profile_id", () => {
      const input = create_empty_profile_link_input("");
      const errors = validate_profile_link_input(input);

      expect(errors).toContain("Profile is required");
    });

    it("rejects whitespace-only profile_id", () => {
      const input = create_empty_profile_link_input("   ");
      const errors = validate_profile_link_input(input);

      expect(errors).toContain("Profile is required");
    });

    it("requires platform", () => {
      const input = {
        ...create_empty_profile_link_input("profile_123"),
        platform: "",
      };
      const errors = validate_profile_link_input(input);

      expect(errors).toContain("Platform is required");
    });

    it("rejects whitespace-only platform", () => {
      const input = {
        ...create_empty_profile_link_input("profile_123"),
        platform: "   ",
      };
      const errors = validate_profile_link_input(input);

      expect(errors).toContain("Platform is required");
    });

    it("requires url", () => {
      const input = {
        ...create_empty_profile_link_input("profile_123"),
        platform: "twitter",
        url: "",
      };
      const errors = validate_profile_link_input(input);

      expect(errors).toContain("URL is required");
    });

    it("rejects whitespace-only url", () => {
      const input = {
        ...create_empty_profile_link_input("profile_123"),
        platform: "twitter",
        url: "   ",
      };
      const errors = validate_profile_link_input(input);

      expect(errors).toContain("URL is required");
    });

    it("validates url format", () => {
      const input = {
        ...create_empty_profile_link_input("profile_123"),
        platform: "twitter",
        url: "not-a-valid-url",
      };
      const errors = validate_profile_link_input(input);

      expect(errors).toContain("Please enter a valid URL");
    });

    it("accepts valid http url", () => {
      const input = {
        ...create_empty_profile_link_input("profile_123"),
        platform: "twitter",
        url: "http://twitter.com/username",
      };
      const errors = validate_profile_link_input(input);

      expect(errors.length).toBe(0);
    });

    it("accepts valid https url", () => {
      const input = {
        ...create_empty_profile_link_input("profile_123"),
        platform: "instagram",
        url: "https://instagram.com/username",
      };
      const errors = validate_profile_link_input(input);

      expect(errors.length).toBe(0);
    });

    it("accepts url with query parameters", () => {
      const input = {
        ...create_empty_profile_link_input("profile_123"),
        platform: "youtube",
        url: "https://youtube.com/watch?v=abc123",
      };
      const errors = validate_profile_link_input(input);

      expect(errors.length).toBe(0);
    });

    it("accepts url with fragment", () => {
      const input = {
        ...create_empty_profile_link_input("profile_123"),
        platform: "website",
        url: "https://example.com/page#section",
      };
      const errors = validate_profile_link_input(input);

      expect(errors.length).toBe(0);
    });

    it("allows empty title", () => {
      const input = {
        ...create_empty_profile_link_input("profile_123"),
        platform: "twitter",
        title: "",
        url: "https://twitter.com/user",
      };
      const errors = validate_profile_link_input(input);

      expect(errors.length).toBe(0);
    });

    it("returns multiple errors when multiple fields invalid", () => {
      const input = create_empty_profile_link_input("");
      const errors = validate_profile_link_input(input);

      expect(errors.length).toBeGreaterThan(1);
      expect(errors).toContain("Profile is required");
      expect(errors).toContain("Platform is required");
      expect(errors).toContain("URL is required");
    });
  });

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
