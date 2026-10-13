import { describe, expect, it, vi } from "vitest";

import type { OfficialRepository, VenueRepository } from "../interfaces/ports";
import { create_official_use_cases } from "../usecases/OfficialUseCases";
import { create_venue_use_cases } from "../usecases/VenueUseCases";
import type { CreateOfficialInput } from "./Official";
import { validate_team_input } from "./Team";
import { apply_team_input_defaults } from "./TeamInputDefaults";
import type { CreateVenueInput } from "./Venue";

function create_echo_repository<TRepository>(): TRepository {
  return {
    create: vi.fn(async (input: object) => ({
      success: true,
      data: { ...input, id: "created_id" },
    })),
  } as unknown as TRepository;
}

const BLANK_FORM_VALUE = "" as unknown as number;

describe("optional numeric fields left blank on create forms", () => {
  it.each([undefined, BLANK_FORM_VALUE])(
    "creates an official without years of experience (%s)",
    async (years_of_experience) => {
      const repository = create_echo_repository<OfficialRepository>();
      const result = await create_official_use_cases(repository).create({
        first_name: "QA",
        last_name: "Umpire",
        organization_id: "org_default_1",
        gender_id: "gender_male",
        nationality: "Uganda",
        status: "active",
        years_of_experience,
      } as unknown as CreateOfficialInput);

      expect(result.success).toBe(true);
    },
  );

  it.each([undefined, BLANK_FORM_VALUE])(
    "creates a venue without a capacity (%s)",
    async (capacity) => {
      const repository = create_echo_repository<VenueRepository>();
      const result = await create_venue_use_cases(repository).create({
        name: "QA Ground",
        short_name: "QAG",
        organization_id: "org_default_1",
        city: "Kampala",
        country: "Uganda",
        status: "active",
        capacity,
      } as unknown as CreateVenueInput);

      expect(result.success).toBe(true);
    },
  );

  it("accepts a team whose established year was left blank", () => {
    const validation_errors = validate_team_input(
      apply_team_input_defaults({
        name: "QA Falcons HC",
        organization_id: "org_default_1",
        gender_id: "gender_male",
        primary_color: "#1c3011",
        status: "active",
        founded_year: BLANK_FORM_VALUE,
      } as never),
    );

    expect(validation_errors).toEqual([]);
  });
});
