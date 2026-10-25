import { describe, expect, it } from "vitest";

import type { BaseEntity, FieldMetadata } from "../../core/entities/BaseEntity";
import { build_foreign_key_select_options } from "./foreignKeyOptionBuilder";

const VENUES = [
  { id: "venue_1", name: "Lugogo Hockey Stadium" },
  { id: "venue_2", name: "Entebbe Sports Club" },
] as unknown as BaseEntity[];

function venue_field(foreign_key_value_field?: string): FieldMetadata {
  return {
    field_name: "venue",
    display_name: "Venue",
    field_type: "foreign_key",
    foreign_key_entity: "venue",
    is_required: false,
    is_read_only: false,
    ...(foreign_key_value_field ? { foreign_key_value_field } : {}),
  };
}

describe("foreign key options can store a named property", () => {
  it("uses the venue name as the stored value when asked", () => {
    expect(
      build_foreign_key_select_options(venue_field("name"), {
        venue: VENUES,
      }).map((option) => option.value),
    ).toEqual(["Lugogo Hockey Stadium", "Entebbe Sports Club"]);
  });

  it("keeps using ids by default", () => {
    expect(
      build_foreign_key_select_options(venue_field(), { venue: VENUES }).map(
        (option) => option.value,
      ),
    ).toEqual(["venue_1", "venue_2"]);
  });
});
