import { describe, expect, it } from "vitest";

import type { EntityMetadata } from "$lib/core/entities/BaseEntity";
import { create_none_option, create_some_option } from "$lib/core/types/Option";

import {
  build_column_display_names,
  resolve_column_display_name,
} from "./dynamicEntityListColumnLabels";

const METADATA = {
  entity_name: "team",
  display_name: "Team",
  fields: [
    {
      field_name: "name",
      display_name: "Team Name",
      field_type: "string",
      is_required: true,
      is_read_only: false,
    },
  ],
} as unknown as EntityMetadata;

describe("build_column_display_names", () => {
  it("maps field names to display names when metadata is present", () => {
    const labels = build_column_display_names(create_some_option(METADATA));
    expect(resolve_column_display_name(labels, "name")).toBe("Team Name");
  });

  it("falls back to the raw field name for unknown columns", () => {
    const labels = build_column_display_names(create_some_option(METADATA));
    expect(resolve_column_display_name(labels, "city")).toBe("city");
  });

  it("uses raw field names when metadata is absent", () => {
    const labels = build_column_display_names(create_none_option());
    expect(resolve_column_display_name(labels, "name")).toBe("name");
  });
});
