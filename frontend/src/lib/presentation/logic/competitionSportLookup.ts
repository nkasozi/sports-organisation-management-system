import type { Competition } from "$lib/core/entities/Competition";
import type { Organization } from "$lib/core/entities/Organization";
import type { Sport } from "$lib/core/entities/Sport";
import type { Result } from "$lib/core/types/Result";

import {
  build_match_report_sport_rules,
  type MatchReportSportRules,
} from "./matchReportSportRules";

const COMPETITION_SPORT_LOG_SCOPE =
  "[CompetitionSport] Sport not found for competition";
const COMPETITION_SPORT_NOT_FOUND_EVENT = "competition_sport_not_found";

export interface CompetitionSportLookupDependencies {
  organization_use_cases: {
    get_by_id: (organization_id: string) => Promise<Result<Organization>>;
  };
  sport_use_cases: {
    get_by_id: (sport_id: string) => Promise<Result<Sport>>;
  };
}

export async function find_competition_sport(
  competition: Competition,
  dependencies: CompetitionSportLookupDependencies,
): Promise<Result<Sport>> {
  const organization_result =
    await dependencies.organization_use_cases.get_by_id(
      competition.organization_id,
    );
  if (!organization_result.success) return organization_result;
  return dependencies.sport_use_cases.get_by_id(
    organization_result.data.sport_id,
  );
}

export async function load_competition_sport_rules(
  competition: Competition,
  dependencies: CompetitionSportLookupDependencies,
): Promise<MatchReportSportRules> {
  const sport_result = await find_competition_sport(competition, dependencies);
  if (sport_result.success)
    return build_match_report_sport_rules(sport_result.data, competition);
  console.warn(COMPETITION_SPORT_LOG_SCOPE, {
    event: COMPETITION_SPORT_NOT_FOUND_EVENT,
    competition_id: competition.id,
    error: sport_result.error,
  });
  return build_match_report_sport_rules(void 0, competition);
}
