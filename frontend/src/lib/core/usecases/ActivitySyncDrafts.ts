import type { Activity } from "../entities/Activity";
import {
  create_activity_from_competition,
  create_activity_from_fixture,
} from "../entities/Activity";
import type { Competition } from "../entities/Competition";
import type { Fixture } from "../entities/Fixture";
import type { TeamRepository } from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type { SyncedActivityDraft } from "./ActivitySourceSync";
import {
  ACTIVITY_SYNC_EVENT,
  ACTIVITY_SYNC_LOG_SCOPE,
} from "./ActivityUseCaseConstants";

const UNKNOWN_TEAM_NAME = "TBD";
const DEFAULT_FIXTURE_START_TIME = "00:00";

export function build_competition_activity_draft(
  competition: Competition,
  organization_id: ScalarValueInput<Activity["organization_id"]>,
  category_id: Activity["category_id"],
): SyncedActivityDraft {
  const activity_input = create_activity_from_competition(
    competition.id,
    competition.name,
    competition.start_date,
    competition.end_date,
    organization_id,
    category_id,
    competition.location,
  );
  return {
    activity_input,
    update_fields: {
      title: activity_input.title,
      start_datetime: activity_input.start_datetime,
      end_datetime: activity_input.end_datetime,
      location: activity_input.location,
    } as Partial<Activity>,
  };
}

async function find_team_name(
  team_repository: TeamRepository,
  team_id: Fixture["home_team_id"],
): Promise<string> {
  const team_result = await team_repository.find_by_id(team_id);
  if (team_result.success) return team_result.data.name || UNKNOWN_TEAM_NAME;
  console.warn(ACTIVITY_SYNC_LOG_SCOPE, {
    event: ACTIVITY_SYNC_EVENT.TEAM_NAME_UNAVAILABLE,
    team_id,
    technical_detail: team_result.error,
  });
  return UNKNOWN_TEAM_NAME;
}

export async function build_fixture_activity_draft(
  team_repository: TeamRepository,
  fixture: Fixture,
  organization_id: ScalarValueInput<Activity["organization_id"]>,
  category_id: Activity["category_id"],
): Promise<SyncedActivityDraft> {
  const home_name = await find_team_name(team_repository, fixture.home_team_id);
  const away_name = await find_team_name(team_repository, fixture.away_team_id);
  const activity_input = create_activity_from_fixture(
    fixture.id,
    `${home_name} vs ${away_name}`,
    `${fixture.scheduled_date}T${fixture.scheduled_time || DEFAULT_FIXTURE_START_TIME}`,
    fixture.competition_id,
    fixture.home_team_id,
    fixture.away_team_id,
    organization_id,
    category_id,
    fixture.venue,
  );
  return {
    activity_input,
    update_fields: {
      title: activity_input.title,
      start_datetime: activity_input.start_datetime,
      end_datetime: activity_input.end_datetime,
      location: activity_input.location,
      team_ids: activity_input.team_ids,
    } as Partial<Activity>,
  };
}
