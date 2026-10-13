import { describe, expect, it, vi } from "vitest";

import type { FixtureRepository } from "../interfaces/ports";
import { create_fixture_use_cases } from "../usecases/FixtureUseCases";
import { FIXTURE_INPUT_DEFAULTS } from "./FixtureInputDefaults";
import type { CreateFixtureInput } from "./FixtureTypes";

const FORM_SUBMITTED_FIXTURE = {
  organization_id: "org_default_1",
  competition_id: "competition_qa_cup",
  stage_id: "stage_round_robin",
  home_team_id: "team_falcons",
  away_team_id: "team_ravens",
  scheduled_date: "2026-10-13",
  scheduled_time: "07:00",
  venue: "Lugogo Hockey Stadium",
  status: "scheduled",
} as unknown as CreateFixtureInput;

describe("creating a fixture from the create form", () => {
  it("defaults the round number the form does not collect", async () => {
    const repository = {
      create: vi.fn(async (input: CreateFixtureInput) => ({
        success: true,
        data: { ...input, id: "fixture_new" },
      })),
    } as unknown as FixtureRepository;

    const result = await create_fixture_use_cases(repository).create(
      FORM_SUBMITTED_FIXTURE,
    );

    expect(result.success).toBe(true);
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        round_number: FIXTURE_INPUT_DEFAULTS.round_number,
      }),
    );
  });
});
