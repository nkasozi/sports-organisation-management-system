import { describe, expect, it } from "vitest";

import {
  validate_record_url_fields,
  validate_url_field_value,
} from "./url_validation";

describe("url_validation", () => {
  it("allows data image urls for image fields", () => {
    expect(
      validate_url_field_value("logo_url", "data:image/png;base64,abc123"),
    ).toEqual({ is_valid: true, error: "" });

    expect(
      validate_url_field_value(
        "profile_image_url",
        "data:image/svg+xml,%3Csvg%3E%3C/svg%3E",
      ),
    ).toEqual({ is_valid: true, error: "" });
  });

  it("allows trusted app asset paths for branding image fields", () => {
    expect(
      validate_url_field_value(
        "background_pattern_url",
        "/african-mosaic-bg.svg",
      ),
    ).toEqual({ is_valid: true, error: "" });
  });

  it("rejects non-image data urls for image fields", () => {
    expect(
      validate_url_field_value(
        "logo_url",
        "data:text/html;base64,PGgxPkJhZDwvaDE+",
      ),
    ).toEqual({
      is_valid: false,
      error: 'URL field "logo_url" uses disallowed protocol "data:"',
    });
  });

  it("keeps non-image url fields restricted to standard urls", () => {
    expect(
      validate_url_field_value("website", "data:image/png;base64,abc123"),
    ).toEqual({
      is_valid: false,
      error: 'URL field "website" uses disallowed protocol "data:"',
    });

    expect(validate_url_field_value("website", "/club-site")).toEqual({
      is_valid: false,
      error: 'URL field "website" contains an invalid URL',
    });
  });

  it("validates mixed image records without rejecting allowed image sources", () => {
    expect(
      validate_record_url_fields({
        logo_url: "data:image/png;base64,abc123",
        document_image_url: "data:image/jpeg;base64,xyz789",
        background_pattern_url: "/african-mosaic-bg.svg",
        website: "https://example.com",
      }),
    ).toEqual({ is_valid: true, error: "" });
  });
});
