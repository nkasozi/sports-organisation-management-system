import { describe, expect, it } from "vitest";

import type { FieldMetadata } from "$lib/core/entities/BaseEntity";
import { create_some_option } from "$lib/core/types/Option";
import { entityMetadataRegistry } from "$lib/infrastructure/registry/EntityMetadataRegistry";

import { fakeDataGenerator } from "./FakeDataGenerator";
import {
  FAKE_DATA_FEMALE_FIRST_NAMES,
  FAKE_DATA_FIRST_NAMES,
  FAKE_DATA_MALE_FIRST_NAMES,
} from "./fakeDataPeopleNames";
import { type FakeDataHints, NO_FAKE_DATA_HINTS } from "./fakeDataScenario";

const REPEAT_COUNT = 40;
const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;

function read_fields(entity_type: string): FieldMetadata[] {
  const metadata = entityMetadataRegistry.get_entity_metadata(entity_type);
  return metadata ? metadata.fields : [];
}

function fill(
  entity_type: string,
  hints: FakeDataHints = NO_FAKE_DATA_HINTS,
): Record<string, unknown> {
  const result = fakeDataGenerator.generate_fake_data_for_entity_fields(
    read_fields(entity_type),
    entity_type,
    hints,
  );
  return result.success ? result.generated_data : {};
}

function repeat_fill(
  entity_type: string,
  hints: FakeDataHints = NO_FAKE_DATA_HINTS,
): Record<string, unknown>[] {
  return Array.from({ length: REPEAT_COUNT }, () => fill(entity_type, hints));
}

function days_between(from_iso: unknown, to_iso: unknown): number {
  return Math.round(
    (Date.parse(String(to_iso)) - Date.parse(String(from_iso))) /
      DAY_MILLISECONDS,
  );
}

function today_iso(): string {
  return new Date().toISOString().slice(0, 10);
}

const CAPACITY_RANGES: readonly [RegExp, number, number][] = [
  [/(Arena|Sports Complex)$/, 500, 5000],
  [/(Grounds|Oval)$/, 1000, 10000],
  [/Stadium$/, 5000, 40000],
];

describe("fake data scenario rules", () => {
  it("makes a fake competition that is already running", () => {
    for (const competition of repeat_fill("competition")) {
      const started_days_ago = days_between(
        competition.start_date,
        today_iso(),
      );
      expect(started_days_ago).toBeGreaterThanOrEqual(0);
      expect(started_days_ago).toBeLessThanOrEqual(14);
      const length = days_between(competition.start_date, competition.end_date);
      expect(length).toBeGreaterThanOrEqual(60);
      expect(length).toBeLessThanOrEqual(150);
      const deadline_gap = days_between(
        competition.registration_deadline,
        competition.start_date,
      );
      expect(deadline_gap).toBeGreaterThanOrEqual(7);
      expect(deadline_gap).toBeLessThanOrEqual(21);
    }
  });

  it("sizes a venue's capacity to its type", () => {
    for (const venue of repeat_fill("venue")) {
      const range = CAPACITY_RANGES.find(([pattern]) =>
        pattern.test(String(venue.name)),
      );
      expect(range).toBeDefined();
      const [, min, max] = range ?? [/x/, 0, 0];
      expect(Number(venue.capacity)).toBeGreaterThanOrEqual(min);
      expect(Number(venue.capacity)).toBeLessThanOrEqual(max);
    }
  });

  it("schedules a fixture at a daytime slot that is in the list", () => {
    const time_field = read_fields("fixture").find(
      (field) => field.field_name === "scheduled_time",
    );
    for (const fixture of repeat_fill("fixture")) {
      const time = String(fixture.scheduled_time);
      expect(time >= "09:00" && time <= "19:00").toBe(true);
      expect(time_field?.enum_values ?? []).toContain(time);
    }
  });

  it("chooses a first name that matches the gender hint", () => {
    const female = {
      ...NO_FAKE_DATA_HINTS,
      gender_name: create_some_option("Female"),
    };
    for (const player of repeat_fill("player", female))
      expect(FAKE_DATA_FEMALE_FIRST_NAMES).toContain(String(player.first_name));
    const male = {
      ...NO_FAKE_DATA_HINTS,
      gender_name: create_some_option("male"),
    };
    for (const official of repeat_fill("official", male))
      expect(FAKE_DATA_MALE_FIRST_NAMES).toContain(String(official.first_name));
    const mixed = {
      ...NO_FAKE_DATA_HINTS,
      gender_name: create_some_option("Mixed"),
    };
    for (const player of repeat_fill("player", mixed))
      expect(FAKE_DATA_FIRST_NAMES).toContain(String(player.first_name));
  });

  it("keeps the female and male first name lists apart", () => {
    expect(FAKE_DATA_FEMALE_FIRST_NAMES).toContain("Agnes");
    expect(FAKE_DATA_MALE_FIRST_NAMES).toContain("Denis");
    expect(
      FAKE_DATA_FEMALE_FIRST_NAMES.some((name) =>
        FAKE_DATA_MALE_FIRST_NAMES.includes(name),
      ),
    ).toBe(false);
  });

  it("names an organisation after the hinted sport", () => {
    const netball = {
      ...NO_FAKE_DATA_HINTS,
      sport_name: create_some_option("Netball"),
    };
    for (const organization of repeat_fill("organization", netball)) {
      expect(String(organization.name)).toContain("Netball");
      expect(String(organization.contact_email)).toContain("netball");
      expect(String(organization.website)).toContain("netball");
    }
  });
});
