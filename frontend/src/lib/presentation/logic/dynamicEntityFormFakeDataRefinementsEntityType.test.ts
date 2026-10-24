import { describe, expect, it } from "vitest";

import type { FieldMetadata } from "../../core/entities/BaseEntity";
import { entityMetadataRegistry } from "../../infrastructure/registry/EntityMetadataRegistry";
import { fakeDataGenerator } from "../../infrastructure/utils/FakeDataGenerator";
import { FAKE_DATA_FEMALE_FIRST_NAMES } from "../../infrastructure/utils/fakeDataPeopleNames";
import { refine_fake_data_after_choices } from "./dynamicEntityFormFakeDataRefinements";

function read_fields(entity_type: string): FieldMetadata[] {
  const metadata = entityMetadataRegistry.get_entity_metadata(entity_type);
  return metadata ? metadata.fields : [];
}

function refine_person(
  form_entity_type: string,
  metadata_type: string,
): string {
  return String(
    refine_fake_data_after_choices({
      entity_type: form_entity_type,
      fields: read_fields(metadata_type),
      form_state: {
        form_data: { gender_id: "g_f", first_name: "Moses" },
        foreign_key_options: { gender_id: [{ id: "g_f", name: "Female" }] },
      } as never,
      locked_field_names: new Set(),
      today: new Date("2026-10-24T10:00:00Z"),
      generate_fake_data: (fields, type, hints) =>
        fakeDataGenerator.generate_fake_data_for_entity_fields(
          fields,
          type,
          hints,
        ),
    }).first_name,
  );
}

describe("fake data refinements with the form's entity type names", () => {
  it("matches the first name to the gender when the form calls it Player", () => {
    for (let round = 0; round < 20; round += 1)
      expect(FAKE_DATA_FEMALE_FIRST_NAMES).toContain(
        refine_person("Player", "player"),
      );
  });

  it("handles names with spaces like Team Staff", () => {
    expect(FAKE_DATA_FEMALE_FIRST_NAMES).toContain(
      refine_person("Team Staff", "teamstaff"),
    );
  });
});
