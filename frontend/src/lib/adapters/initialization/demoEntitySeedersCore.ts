import type { Organization } from "../../core/entities/Organization";
import type { ScalarValueInput } from "../../core/types/DomainScalars";
import type { Result } from "../../core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "../../core/types/Result";
import {
  create_seed_officials,
  create_seed_players,
  create_seed_team_staff,
  create_seed_teams,
  create_seed_venues,
} from "../../infrastructure/utils/SeedDataGenerator";
import type { InBrowserOfficialRepository } from "../repositories/InBrowserOfficialRepository";
import type { InBrowserPlayerRepository } from "../repositories/InBrowserPlayerRepository";
import type { InBrowserTeamRepository } from "../repositories/InBrowserTeamRepository";
import type { InBrowserTeamStaffRepository } from "../repositories/InBrowserTeamStaffRepository";
import type { InBrowserVenueRepository } from "../repositories/InBrowserVenueRepository";
import {
  announce_seeded_batch,
  describe_person,
  log_seeding_failure,
  log_seeding_started,
  seed_demo_entity_batch,
} from "./demoEntityBatchSeeder";
import {
  INITIALIZATION_ERROR_CODE,
  INITIALIZATION_EVENT,
} from "./initializationEvents";
import { INITIALIZATION_ERROR_MESSAGE } from "./initializationMessages";
import type {
  PositionIds,
  SeedEntityIdLookups,
  SeedVenueIds,
} from "./seedingTypes";

const PLAYER_ENTITY_TYPE = "player";
const VENUE_ENTITY_TYPE = "venue";

export {
  seed_demo_competition_stages,
  seed_demo_competitions,
} from "./demoCompetitionSeeders";

export async function seed_demo_players(
  organization_id: ScalarValueInput<Organization["id"]>,
  player_repository: InBrowserPlayerRepository,
  position_ids: PositionIds,
): Promise<Result<number>> {
  log_seeding_started(PLAYER_ENTITY_TYPE);
  const seed_players = create_seed_players(position_ids, organization_id);
  for (const player of seed_players) {
    const result = await player_repository.seed_with_data([player]);
    if (!result.success)
      return log_seeding_failure(PLAYER_ENTITY_TYPE, "players", result.error);
  }
  return announce_seeded_batch({
    plural_label: "players",
    entity_type: PLAYER_ENTITY_TYPE,
    entities: seed_players,
    seed: (players) => player_repository.seed_with_data(players),
    describe_entity: describe_person,
  });
}

function extract_seed_venue_ids(
  seed_venues: ReturnType<typeof create_seed_venues>,
): Result<SeedVenueIds> {
  const [dragon, thunder, eagle, storm, international] = seed_venues;
  if (!dragon || !thunder || !eagle || !storm || !international) {
    console.error("[Seeding] Demo venue ids incomplete", {
      event: INITIALIZATION_EVENT.DEMO_VENUE_IDS_INCOMPLETE,
      error_code: INITIALIZATION_ERROR_CODE.DEMO_SEEDING_FAILED,
      entity_type: VENUE_ENTITY_TYPE,
      count: seed_venues.length,
    });
    return create_failure_result(
      INITIALIZATION_ERROR_MESSAGE.VENUE_IDS_INCOMPLETE,
    );
  }
  return create_success_result({
    dragon_stadium_id: dragon.id,
    thunder_arena_id: thunder.id,
    eagle_nest_id: eagle.id,
    storm_center_id: storm.id,
    international_hockey_arena_id: international.id,
  });
}

export async function seed_demo_venues(
  organization_id: ScalarValueInput<Organization["id"]>,
  venue_repository: InBrowserVenueRepository,
): Promise<Result<SeedVenueIds>> {
  log_seeding_started(VENUE_ENTITY_TYPE);
  const seed_venues = create_seed_venues(organization_id);
  const result = await venue_repository.seed_with_data(seed_venues);
  if (!result.success)
    return log_seeding_failure(VENUE_ENTITY_TYPE, "venues", result.error);
  const venue_ids = extract_seed_venue_ids(seed_venues);
  if (!venue_ids.success) return venue_ids;
  const announced = announce_seeded_batch({
    plural_label: "venues",
    entity_type: VENUE_ENTITY_TYPE,
    entities: seed_venues,
    seed: (venues) => venue_repository.seed_with_data(venues),
    describe_entity: (v) => v.name,
  });
  if (!announced.success) return announced;
  return venue_ids;
}

export async function seed_demo_teams(
  team_repository: InBrowserTeamRepository,
  venue_ids: SeedVenueIds,
): Promise<Result<number>> {
  return seed_demo_entity_batch({
    plural_label: "teams",
    entity_type: "team",
    entities: create_seed_teams(
      venue_ids.dragon_stadium_id,
      venue_ids.thunder_arena_id,
      venue_ids.eagle_nest_id,
      venue_ids.storm_center_id,
      venue_ids.international_hockey_arena_id,
    ),
    seed: (teams) => team_repository.seed_with_data(teams),
    describe_entity: (t) => t.name,
  });
}

export async function seed_demo_team_staff(
  team_staff_repository: InBrowserTeamStaffRepository,
  entity_id_lookups: SeedEntityIdLookups,
): Promise<Result<number>> {
  return seed_demo_entity_batch({
    plural_label: "team staff",
    entity_type: "team_staff",
    entities: create_seed_team_staff(
      entity_id_lookups.head_coach_role_id,
      entity_id_lookups.assistant_coach_role_id,
      entity_id_lookups.physio_role_id,
      entity_id_lookups.team_manager_role_id,
    ),
    seed: (staff) => team_staff_repository.seed_with_data(staff),
    describe_entity: describe_person,
  });
}

export async function seed_demo_officials(
  organization_id: ScalarValueInput<Organization["id"]>,
  official_repository: InBrowserOfficialRepository,
): Promise<Result<number>> {
  return seed_demo_entity_batch({
    plural_label: "officials",
    entity_type: "official",
    entities: create_seed_officials(organization_id),
    seed: (officials) => official_repository.seed_with_data(officials),
    describe_entity: describe_person,
  });
}
