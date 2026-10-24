import { describe, expect, it } from "vitest";

import type { FieldMetadata } from "../../core/entities/BaseEntity";
import { entityMetadataRegistry } from "../../infrastructure/registry/EntityMetadataRegistry";
import { fakeDataGenerator } from "../../infrastructure/utils/FakeDataGenerator";
import {
  FAKE_DATA_FEMALE_FIRST_NAMES,
  FAKE_DATA_MALE_FIRST_NAMES,
} from "../../infrastructure/utils/fakeDataPeopleNames";
import { refine_fake_data_after_choices } from "./dynamicEntityFormFakeDataRefinements";

const REPEAT_COUNT = 30;
const TODAY = new Date("2026-10-24T10:00:00Z");

function read_fields(entity_type: string): FieldMetadata[] {
  const metadata = entityMetadataRegistry.get_entity_metadata(entity_type);
  return metadata ? metadata.fields : [];
}

function refine(
  entity_type: string,
  form_data: Record<string, unknown>,
  foreign_key_options: Record<string, Record<string, unknown>[]>,
  locked: string[] = [],
): Record<string, unknown> {
  return refine_fake_data_after_choices({
    entity_type,
    fields: read_fields(entity_type),
    form_state: { form_data, foreign_key_options } as never,
    locked_field_names: new Set(locked),
    today: TODAY,
    generate_fake_data: (fields, type, hints) =>
      fakeDataGenerator.generate_fake_data_for_entity_fields(
        fields,
        type,
        hints,
      ),
  });
}

function fixture_with_competition(
  start_date: string,
  end_date: string,
): Record<string, unknown> {
  return refine(
    "fixture",
    { competition_id: "c1", scheduled_date: "2026-01-01", venue: "Gulu Oval" },
    { competition_id: [{ id: "c1", start_date, end_date }] },
  );
}

describe("fake data refined after dropdown choices", () => {
  it("schedules a fixture inside an upcoming competition", () => {
    for (let round = 0; round < REPEAT_COUNT; round += 1) {
      const date = String(
        fixture_with_competition("2026-12-29", "2027-02-23").scheduled_date,
      );
      expect(date >= "2026-12-29" && date <= "2027-02-23").toBe(true);
    }
  });

  it("schedules a fixture from today onward when the competition is running", () => {
    for (let round = 0; round < REPEAT_COUNT; round += 1) {
      const date = String(
        fixture_with_competition("2026-10-10", "2026-11-05").scheduled_date,
      );
      expect(date >= "2026-10-24" && date <= "2026-11-05").toBe(true);
    }
  });

  it("keeps a fixture date the user locked or when no competition is chosen", () => {
    const locked = refine(
      "fixture",
      { competition_id: "c1", scheduled_date: "2026-01-01" },
      {
        competition_id: [
          { id: "c1", start_date: "2026-12-29", end_date: "2027-02-23" },
        ],
      },
      ["scheduled_date"],
    );
    expect(locked.scheduled_date).toBe("2026-01-01");
    const unchosen = refine("fixture", { scheduled_date: "2026-01-01" }, {});
    expect(unchosen.scheduled_date).toBe("2026-01-01");
  });

  it("uses a real venue of the chosen organisation when venues are loaded", () => {
    const filled = refine(
      "fixture",
      { organization_id: "org_1", venue: "Gulu Oval" },
      {
        organization_id: [{ id: "org_1" }],
        venue_id: [
          { id: "v1", name: "Mandela Stadium", organization_id: "org_1" },
          { id: "v2", name: "Other Arena", organization_id: "org_2" },
        ],
      },
    );
    expect(filled.venue).toBe("Mandela Stadium");
    const without_venues = refine("fixture", { venue: "Gulu Oval" }, {});
    expect(without_venues.venue).toBe("Gulu Oval");
  });

  it("gives a person a first name that matches the chosen gender", () => {
    for (let round = 0; round < REPEAT_COUNT; round += 1) {
      const female = refine(
        "player",
        { gender_id: "g_f", first_name: "Denis" },
        { gender_id: [{ id: "g_f", name: "Female" }] },
      );
      expect(FAKE_DATA_FEMALE_FIRST_NAMES).toContain(String(female.first_name));
      expect(String(female.email)).toContain(
        String(female.first_name).toLowerCase(),
      );
      expect(String(female.emergency_contact_name)).toContain(
        String(female.last_name),
      );
      const male = refine(
        "official",
        { gender_id: "g_m", first_name: "Agnes" },
        { gender_id: [{ id: "g_m", name: "Male" }] },
      );
      expect(FAKE_DATA_MALE_FIRST_NAMES).toContain(String(male.first_name));
    }
  });

  it("names an organisation after the chosen sport", () => {
    const filled = refine(
      "organization",
      { sport_id: "s1", name: "Gulu Rugby Union" },
      { sport_id: [{ id: "s1", name: "Netball" }] },
    );
    expect(String(filled.name)).toContain("Netball");
    expect(String(filled.description)).toContain("netball");
    expect(String(filled.website)).toContain("netball");
  });

  it("leaves other entities as they are", () => {
    const form_data = { name: "Kampala Lions" };
    expect(refine("team", form_data, {})).toEqual(form_data);
  });
});
