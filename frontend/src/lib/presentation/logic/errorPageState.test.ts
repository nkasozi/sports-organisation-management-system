import { describe, expect, it } from "vitest";

import { get_error_config } from "./errorPageState";

describe("errorPageState", () => {
  it("returns a not-found error configuration for missing pages", () => {
    expect(get_error_config(404)).toEqual({
      icon: "search",
      title: "Page Not Found",
      subtitle: "We looked everywhere",
      description:
        "The page you're looking for doesn't exist or may have been moved. Check the URL or navigate back to a safe place.",
      primary_action_label: "Go Home",
      primary_action_href: "/",
      secondary_action_label: "Go Back",
      show_error_code: true,
      accent_color: "blue",
    });
  });

  it("returns sign-in and fallback server configs for protected and unexpected errors", () => {
    expect(get_error_config(401)).toEqual(
      expect.objectContaining({
        title: "Authentication Required",
        primary_action_href: "/sign-in",
        show_error_code: false,
      }),
    );
    expect(get_error_config(500)).toEqual({
      icon: "alert",
      title: "Something Went Wrong",
      subtitle: "Server error",
      description:
        "We're experiencing technical difficulties. Please try again in a moment. If the problem persists, contact support.",
      primary_action_label: "Try Again",
      primary_action_href: "",
      secondary_action_label: "Go Home",
      show_error_code: true,
      accent_color: "red",
    });
  });

  it("returns an access-denied configuration for forbidden pages", () => {
    expect(get_error_config(403)).toEqual({
      icon: "shield",
      title: "Access Denied",
      subtitle: "Permission required",
      description:
        "You don't have permission to view this page. Contact your administrator if you believe this is an error.",
      primary_action_label: "Go Home",
      primary_action_href: "/",
      secondary_action_label: "Contact Support",
      show_error_code: false,
      accent_color: "red",
    });
  });

  it("returns the full sign-in configuration for unauthenticated access", () => {
    expect(get_error_config(401)).toEqual({
      icon: "lock",
      title: "Authentication Required",
      subtitle: "Sign in to continue",
      description: "You need to be signed in to access this page.",
      primary_action_label: "Sign In",
      primary_action_href: "/sign-in",
      secondary_action_label: "Go Home",
      show_error_code: false,
      accent_color: "blue",
    });
  });
});
