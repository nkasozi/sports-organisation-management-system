import { describe, expect, it, vi } from "vitest";

import type { FieldMetadata } from "../../core/entities/BaseEntity";
import { generate_bulk_import_example_value } from "./bulkImportCsvExampleValues";
import { get_bulk_import_foreign_key_fields } from "./bulkImportFields";

vi.mock("$lib/infrastructure/registry/EntityMetadataRegistry", () => ({
  entityMetadataRegistry: { get_entity_metadata: vi.fn() },
}));

const VENUE_FIELD: FieldMetadata = {
  field_name: "venue",
  display_name: "Venue",
  field_type: "foreign_key",
  foreign_key_entity: "venue",
  foreign_key_value_field: "name",
  is_required: false,
  is_read_only: false,
};

describe("bulk import treats a name-valued venue as text", () => {
  it("does not resolve the venue to an id", () => {
    expect(get_bulk_import_foreign_key_fields([VENUE_FIELD])).toEqual([]);
  });

  it("shows a text example in the template", () => {
    expect(generate_bulk_import_example_value(VENUE_FIELD)).not.toMatch(/_id$/);
  });
});
