import type { Competition } from "$lib/core/entities/Competition";
import type { Fixture } from "$lib/core/entities/Fixture";
import type {
  MatchReportCompetitionState,
  MatchReportPageDependencies,
  MatchReportSportState,
} from "$lib/presentation/logic/matchReportPageLoadTypes";

import { PRESENCE_STATUS } from "./presenceStatus";

type CompetitionBundleDependencies = Pick<
  MatchReportPageDependencies,
  "competition_use_cases" | "organization_use_cases" | "sport_use_cases"
>;

interface MatchReportCompetitionBundle {
  competition_state: MatchReportCompetitionState;
  organization_name: string;
  sport_state: MatchReportSportState;
}

const MISSING_SPORT_STATE: MatchReportSportState = {
  status: PRESENCE_STATUS.MISSING,
};

function create_missing_competition_bundle(): MatchReportCompetitionBundle {
  return {
    competition_state: { status: PRESENCE_STATUS.MISSING },
    organization_name: "",
    sport_state: { status: PRESENCE_STATUS.MISSING },
  };
}

function create_competition_bundle(
  competition: Competition,
  organization_name: string,
  sport_state: MatchReportSportState,
): MatchReportCompetitionBundle {
  return {
    competition_state: { status: PRESENCE_STATUS.PRESENT, competition },
    organization_name,
    sport_state,
  };
}

async function load_match_report_sport_state(
  sport_id: string,
  dependencies: CompetitionBundleDependencies,
): Promise<MatchReportSportState> {
  const sport_result = await dependencies.sport_use_cases.get_by_id(sport_id);
  return sport_result.success && sport_result.data
    ? { status: PRESENCE_STATUS.PRESENT, sport: sport_result.data }
    : { status: PRESENCE_STATUS.MISSING };
}

async function load_match_report_organization_bundle(
  competition: Competition,
  dependencies: CompetitionBundleDependencies,
): Promise<MatchReportCompetitionBundle> {
  if (!competition.organization_id)
    return create_competition_bundle(competition, "", {
      ...MISSING_SPORT_STATE,
    });
  const organization_result =
    await dependencies.organization_use_cases.get_by_id(
      competition.organization_id,
    );
  if (!organization_result.success || !organization_result.data)
    return create_competition_bundle(competition, "", {
      ...MISSING_SPORT_STATE,
    });
  const organization_name = organization_result.data.name;
  if (!organization_result.data.sport_id)
    return create_competition_bundle(competition, organization_name, {
      ...MISSING_SPORT_STATE,
    });
  return create_competition_bundle(
    competition,
    organization_name,
    await load_match_report_sport_state(
      organization_result.data.sport_id,
      dependencies,
    ),
  );
}

export async function load_match_report_competition_bundle(
  fixture: Fixture,
  dependencies: CompetitionBundleDependencies,
): Promise<MatchReportCompetitionBundle> {
  if (!fixture.competition_id) return create_missing_competition_bundle();
  const competition_result = await dependencies.competition_use_cases.get_by_id(
    fixture.competition_id,
  );
  if (!competition_result.success || !competition_result.data)
    return create_missing_competition_bundle();
  return load_match_report_organization_bundle(
    competition_result.data,
    dependencies,
  );
}
