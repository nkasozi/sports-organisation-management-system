import { describe, expect, it } from "vitest";

import type { FieldMetadata } from "$lib/core/entities/BaseEntity";
import { entityMetadataRegistry } from "$lib/infrastructure/registry/EntityMetadataRegistry";

import { fakeDataGenerator } from "./FakeDataGenerator";
import {
  FAKE_DATA_FIRST_NAMES,
  FAKE_DATA_LAST_NAMES,
} from "./fakeDataPeopleNames";
import { FAKE_DATA_CITIES } from "./fakeDataVocabulary";

const REPEAT_COUNT = 25;

function read_fields(entity_type: string): FieldMetadata[] {
  const metadata = entityMetadataRegistry.get_entity_metadata(entity_type);
  return metadata ? metadata.fields : [];
}

function fill(entity_type: string): Record<string, unknown> {
  const result = fakeDataGenerator.generate_fake_data_for_entity_fields(
    read_fields(entity_type),
    entity_type,
  );
  if (!result.success) return {};
  return result.generated_data;
}

function repeat_fill(entity_type: string): Record<string, unknown>[] {
  return Array.from({ length: REPEAT_COUNT }, () => fill(entity_type));
}

function text(value: unknown): string {
  return String(value);
}

const COMPANY_SUFFIX_PATTERN = /\b(Inc|LLC|Ltd|Group|and Sons|PLC)\b/;

describe("context-aware fake data", () => {
  it("names a team after a city with a short name taken from it", () => {
    for (const team of repeat_fill("team")) {
      const [city] = text(team.name).split(" ");
      expect(
        FAKE_DATA_CITIES.some((known) => text(team.name).startsWith(known)),
      ).toBe(true);
      expect(text(team.short_name)).toMatch(/^[A-Z]{3}$/);
      expect(text(team.short_name)).toBe(city.slice(0, 3).toUpperCase());
      expect(text(team.name)).not.toMatch(COMPANY_SUFFIX_PATTERN);
    }
  });

  it("names an organisation as a sports body and describes it", () => {
    for (const organization of repeat_fill("organization")) {
      expect(text(organization.name)).toMatch(
        /(Association|Federation|Union|League)$/,
      );
      expect(text(organization.description).length).toBeGreaterThan(20);
      expect(text(organization.description)).not.toMatch(/lorem|ipsum/i);
      expect(text(organization.contact_phone)).toMatch(
        /^\+256 7\d{2} \d{3} \d{3}$/,
      );
      expect(text(organization.website)).toMatch(
        /^https:\/\/www\.[a-z0-9-]+\.org$/,
      );
      expect(new Date(text(organization.founded_date)).getTime()).toBeLessThan(
        Date.now(),
      );
    }
  });

  it("keeps competition dates in order and puts the start year in the name", () => {
    for (const competition of repeat_fill("competition")) {
      const start = text(competition.start_date);
      expect(text(competition.registration_deadline) < start).toBe(true);
      expect(start < text(competition.end_date)).toBe(true);
      expect(text(competition.name)).toContain(start.slice(0, 4));
      expect(Number(competition.max_teams)).toBeGreaterThanOrEqual(4);
    }
  });

  it("gives a venue a venue name, a city address and a realistic capacity", () => {
    for (const venue of repeat_fill("venue")) {
      expect(text(venue.name)).toMatch(
        /(Stadium|Grounds|Arena|Sports Complex|Oval)$/,
      );
      expect(FAKE_DATA_CITIES).toContain(text(venue.city));
      expect(text(venue.address)).toContain(text(venue.city));
      expect(venue.country).toBe("Uganda");
      expect(
        text(venue.name).startsWith(text(venue.city)) ||
          !FAKE_DATA_CITIES.some((city) => text(venue.name).startsWith(city)),
      ).toBe(true);
      expect(Number(venue.capacity)).toBeGreaterThanOrEqual(500);
    }
  });

  it("builds a person's email from their own name", () => {
    for (const player of repeat_fill("player")) {
      expect(FAKE_DATA_FIRST_NAMES).toContain(text(player.first_name));
      expect(FAKE_DATA_LAST_NAMES).toContain(text(player.last_name));
      const email = text(player.email).toLowerCase();
      expect(email).toContain(
        text(player.first_name)
          .toLowerCase()
          .replace(/[^a-z]/g, ""),
      );
      const age =
        new Date().getFullYear() -
        Number(text(player.date_of_birth).slice(0, 4));
      expect(age).toBeGreaterThanOrEqual(15);
      expect(age).toBeLessThanOrEqual(40);
    }
  });

  it("keeps sport player counts consistent", () => {
    for (const sport of repeat_fill("sport")) {
      expect(Number(sport.min_players_on_field)).toBeLessThanOrEqual(
        Number(sport.max_players_on_field),
      );
      expect(Number(sport.max_players_on_field)).toBeLessThanOrEqual(
        Number(sport.max_squad_size),
      );
      expect(Number(sport.min_players_per_fixture)).toBeLessThanOrEqual(
        Number(sport.max_players_per_fixture),
      );
      expect(text(sport.code)).toMatch(/^[A-Z]{2,4}$/);
      expect(text(sport.icon_url)).toMatch(/^\p{Extended_Pictographic}/u);
    }
  });

  it("issues qualifications before they expire", () => {
    for (const qualification of repeat_fill("qualification")) {
      expect(
        text(qualification.issue_date) < text(qualification.expiry_date),
      ).toBe(true);
      expect(text(qualification.certification_name)).not.toMatch(
        /lorem|ipsum/i,
      );
    }
  });

  it("suggests real role names for staff and official roles", () => {
    for (const role of repeat_fill("teamstaffrole"))
      expect(text(role.name)).toMatch(
        /Coach|Manager|Physiotherapist|Analyst|Doctor|Captain/,
      );
    for (const role of repeat_fill("gameofficialrole"))
      expect(text(role.name)).toMatch(
        /Referee|Official|Umpire|Judge|Timekeeper|Scorer/,
      );
  });

  it("still fills an entity it has no special rules for", () => {
    const filled = fakeDataGenerator.generate_fake_data_for_entity_fields(
      read_fields("gender"),
      "unknown_entity",
    );
    expect(filled.success).toBe(true);
  });
});
