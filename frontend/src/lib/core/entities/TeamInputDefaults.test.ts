import { describe, expect, it, vi } from "vitest";

import type { TeamRepository } from "../interfaces/ports";
import { create_team_use_cases } from "../usecases/TeamUseCases";
import type { CreateTeamInput } from "./Team";
import {
  apply_team_input_defaults,
  TEAM_INPUT_DEFAULTS,
} from "./TeamInputDefaults";

const FORM_SUBMITTED_TEAM = {
  name: "QA Falcons HC",
  organization_id: "org_default_1",
  gender_id: "gender_male",
  short_name: "QAF",
  founded_year: 2000,
  primary_color: "#1c3011",
  status: "active",
} as unknown as CreateTeamInput;

describe("team input defaults", () => {
  it("fills fields the create form does not collect", () => {
    const completed_input = apply_team_input_defaults(FORM_SUBMITTED_TEAM);

    expect(completed_input.max_squad_size).toBe(
      TEAM_INPUT_DEFAULTS.max_squad_size,
    );
    expect(completed_input.secondary_color).toBe(
      TEAM_INPUT_DEFAULTS.secondary_color,
    );
    expect(completed_input.description).toBe(TEAM_INPUT_DEFAULTS.description);
  });

  it("keeps every value the user provided", () => {
    const completed_input = apply_team_input_defaults({
      ...FORM_SUBMITTED_TEAM,
      max_squad_size: 18,
    });

    expect(completed_input.max_squad_size).toBe(18);
    expect(completed_input.primary_color).toBe("#1c3011");
    expect(completed_input.name).toBe("QA Falcons HC");
  });

  it("lets a team created from the form pass validation and be saved", async () => {
    const repository = {
      create: vi.fn(async (input: CreateTeamInput) => ({
        success: true,
        data: { ...input, id: "team_new" },
      })),
    } as unknown as TeamRepository;

    const result =
      await create_team_use_cases(repository).create(FORM_SUBMITTED_TEAM);

    expect(result.success).toBe(true);
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        max_squad_size: TEAM_INPUT_DEFAULTS.max_squad_size,
        secondary_color: TEAM_INPUT_DEFAULTS.secondary_color,
      }),
    );
  });
});
