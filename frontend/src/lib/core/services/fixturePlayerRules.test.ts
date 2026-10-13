import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Competition } from "../entities/Competition";
import type { CompetitionUseCases } from "../usecases/CompetitionUseCases";
import type { OrganizationUseCases } from "../usecases/OrganizationUseCases";
import type { SportUseCases } from "../usecases/SportUseCases";
import { FIXTURE_LINEUP_GENERATION_MESSAGES } from "./FixtureLineupGenerationConstants";
import {
  get_player_rules_from_competition,
  type PlayerRulesResult,
} from "./fixturePlayerRules";

interface RuleSourceResults {
  competition: unknown;
  organization: unknown;
  sport: unknown;
}

const COMPETITION = {
  success: true,
  data: {
    id: "comp-1",
    organization_id: "org-1",
    rule_overrides: { min_players_on_field: 4 },
    squad_generation_strategy: "previous_match",
  },
};
const ORGANIZATION = { success: true, data: { id: "org-1", sport_id: "s-1" } };
const SPORT = {
  success: true,
  data: { min_players_per_fixture: 7, max_players_per_fixture: 16 },
};

function load_rules(results: RuleSourceResults): Promise<PlayerRulesResult> {
  return get_player_rules_from_competition(
    "comp-1" as Competition["id"],
    {
      get_by_id: vi.fn().mockResolvedValue(results.competition),
    } as Partial<CompetitionUseCases> as CompetitionUseCases,
    {
      get_by_id: vi.fn().mockResolvedValue(results.organization),
    } as Partial<OrganizationUseCases> as OrganizationUseCases,
    {
      get_by_id: vi.fn().mockResolvedValue(results.sport),
    } as Partial<SportUseCases> as SportUseCases,
  );
}

describe("get_player_rules_from_competition", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("combines competition overrides with sport defaults", async () => {
    const result = await load_rules({
      competition: COMPETITION,
      organization: ORGANIZATION,
      sport: SPORT,
    });
    expect(result).toEqual({
      success: true,
      min_players: 4,
      max_players: 16,
      squad_generation_strategy: "previous_match",
    });
  });

  it("fails when the competition cannot be loaded", async () => {
    const result = await load_rules({
      competition: { success: false, error: "offline" },
      organization: ORGANIZATION,
      sport: SPORT,
    });
    expect(result).toEqual({
      success: false,
      error_message: FIXTURE_LINEUP_GENERATION_MESSAGES.COMPETITION_LOAD_FAILED,
    });
  });

  it("fails instead of guessing limits when the organization or sport is missing", async () => {
    const organization_failure = await load_rules({
      competition: COMPETITION,
      organization: { success: false, error: "offline" },
      sport: SPORT,
    });
    const sport_failure = await load_rules({
      competition: COMPETITION,
      organization: ORGANIZATION,
      sport: { success: false, error: "offline" },
    });
    expect(organization_failure).toEqual({
      success: false,
      error_message:
        FIXTURE_LINEUP_GENERATION_MESSAGES.ORGANIZATION_LOAD_FAILED,
    });
    expect(sport_failure).toEqual({
      success: false,
      error_message: FIXTURE_LINEUP_GENERATION_MESSAGES.SPORT_LOAD_FAILED,
    });
  });
});
