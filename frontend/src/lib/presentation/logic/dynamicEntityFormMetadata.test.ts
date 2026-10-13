import { afterEach, describe, expect, it, vi } from "vitest";

import {
  build_dynamic_entity_form_metadata_props,
  find_dynamic_entity_form_metadata,
} from "./dynamicEntityFormMetadata";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("find_dynamic_entity_form_metadata", () => {
  it("finds metadata for a registered entity type regardless of case", () => {
    const metadata_option = find_dynamic_entity_form_metadata("Team");

    expect(metadata_option.status).toBe("some");
  });

  it("returns none and logs a structured error for an unknown entity type", () => {
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(find_dynamic_entity_form_metadata("NotAnEntity")).toEqual({
      status: "none",
    });
    expect(error_spy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        event: "dynamic_entity_form_metadata_missing",
        entity_type: "NotAnEntity",
      }),
    );
  });
});

describe("build_dynamic_entity_form_metadata_props", () => {
  it("exposes present metadata to the form components", () => {
    const metadata = { entity_name: "team" } as never;

    expect(
      build_dynamic_entity_form_metadata_props({
        status: "some",
        value: metadata,
      }),
    ).toEqual({ entity_metadata: metadata });
  });

  it("exposes no metadata when none was found", () => {
    expect(
      build_dynamic_entity_form_metadata_props({ status: "none" }),
    ).toEqual({});
  });
});
