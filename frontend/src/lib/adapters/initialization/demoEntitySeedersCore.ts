import type { Result } from "../../core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "../../core/types/Result";
import {
  create_seed_competition_stages,
  create_seed_competitions,
  create_seed_officials,
  create_seed_players,
  create_seed_team_staff,
  create_seed_teams,
  create_seed_venues,
} from "../../infrastructure/utils/SeedDataGenerator";
import type { InBrowserCompetitionRepository } from "../repositories/InBrowserCompetitionRepository";
import type { InBrowserCompetitionStageRepository } from "../repositories/InBrowserCompetitionStageRepository";
import type { InBrowserOfficialRepository } from "../repositories/InBrowserOfficialRepository";
import type { InBrowserPlayerRepository } from "../repositories/InBrowserPlayerRepository";
import type { InBrowserTeamRepository } from "../repositories/InBrowserTeamRepository";
import type { InBrowserTeamStaffRepository } from "../repositories/InBrowserTeamStaffRepository";
import type { InBrowserVenueRepository } from "../repositories/InBrowserVenueRepository";
import type {
  PositionIds,
  SeedEntityIdLookups,
  SeedVenueIds,
} from "./seedingTypes";
import { emit_entity_created_events } from "./seedingUserSetup";

export async function seed_demo_players(
  organization_id: string,
  player_repository: InBrowserPlayerRepository,
  position_ids: PositionIds,
): Promise<Result<number>> {
  console.log(`[Seeding] Seeding demo players for org: ${organization_id}`);
  const seed_players = create_seed_players(position_ids, organization_id);
  for (const player of seed_players) {
    const result = await player_repository.seed_with_data([player]);
    if (!result.success) {
      console.error(`[Seeding] Player seeding failed: ${result.error}`);
      return create_failure_result(`Player seeding failed: ${result.error}`);
    }
  }
  emit_entity_created_events(
    "player",
    seed_players,
    (p) => `${p.first_name} ${p.last_name}`,
  );
  console.log(`[Seeding] Seeded ${seed_players.length} players`);
  return create_success_result(seed_players.length);
}

export async function seed_demo_venues(
  organization_id: string,
  venue_repository: InBrowserVenueRepository,
): Promise<Result<SeedVenueIds>> {
  console.log(`[Seeding] Seeding demo venues for org: ${organization_id}`);
  const seed_venues = create_seed_venues(organization_id);
  const result = await venue_repository.seed_with_data(seed_venues);
  if (!result.success) {
    console.error(`[Seeding] Venue seeding failed: ${result.error}`);
    return create_failure_result(`Venue seeding failed: ${result.error}`);
  }
  emit_entity_created_events("venue", seed_venues, (v) => v.name);
  console.log(`[Seeding] Seeded ${seed_venues.length} venues`);
  return create_success_result({
    dragon_stadium_id: seed_venues[0]?.id ?? "",
    thunder_arena_id: seed_venues[1]?.id ?? "",
    eagle_nest_id: seed_venues[2]?.id ?? "",
    storm_center_id: seed_venues[3]?.id ?? "",
    international_hockey_arena_id: seed_venues[4]?.id ?? "",
  });
}

export async function seed_demo_teams(
  team_repository: InBrowserTeamRepository,
  venue_ids: SeedVenueIds,
): Promise<Result<number>> {
  console.log("[Seeding] Seeding demo teams");
  const seed_teams = create_seed_teams(
    venue_ids.dragon_stadium_id,
    venue_ids.thunder_arena_id,
    venue_ids.eagle_nest_id,
    venue_ids.storm_center_id,
    venue_ids.international_hockey_arena_id,
  );
  const result = await team_repository.seed_with_data(seed_teams);
  if (!result.success) {
    console.error(`[Seeding] Team seeding failed: ${result.error}`);
    return create_failure_result(`Team seeding failed: ${result.error}`);
  }
  emit_entity_created_events("team", seed_teams, (t) => t.name);
  console.log(`[Seeding] Seeded ${seed_teams.length} teams`);
  return create_success_result(seed_teams.length);
}

export async function seed_demo_team_staff(
  team_staff_repository: InBrowserTeamStaffRepository,
  entity_id_lookups: SeedEntityIdLookups,
): Promise<Result<number>> {
  console.log("[Seeding] Seeding demo team staff");
  const seed_staff = create_seed_team_staff(
    entity_id_lookups.head_coach_role_id,
    entity_id_lookups.assistant_coach_role_id,
    entity_id_lookups.physio_role_id,
    entity_id_lookups.team_manager_role_id,
  );
  const result = await team_staff_repository.seed_with_data(seed_staff);
  if (!result.success) {
    console.error(`[Seeding] Team staff seeding failed: ${result.error}`);
    return create_failure_result(`Team staff seeding failed: ${result.error}`);
  }
  emit_entity_created_events(
    "team_staff",
    seed_staff,
    (s) => `${s.first_name} ${s.last_name}`,
  );
  console.log(`[Seeding] Seeded ${seed_staff.length} team staff`);
  return create_success_result(seed_staff.length);
}

export async function seed_demo_officials(
  organization_id: string,
  official_repository: InBrowserOfficialRepository,
): Promise<Result<number>> {
  console.log(`[Seeding] Seeding demo officials for org: ${organization_id}`);
  const seed_officials = create_seed_officials(organization_id);
  const result = await official_repository.seed_with_data(seed_officials);
  if (!result.success) {
    console.error(`[Seeding] Official seeding failed: ${result.error}`);
    return create_failure_result(`Official seeding failed: ${result.error}`);
  }
  emit_entity_created_events(
    "official",
    seed_officials,
    (o) => `${o.first_name} ${o.last_name}`,
  );
  console.log(`[Seeding] Seeded ${seed_officials.length} officials`);
  return create_success_result(seed_officials.length);
}

export async function seed_demo_competitions(
  competition_repository: InBrowserCompetitionRepository,
  entity_id_lookups: SeedEntityIdLookups,
): Promise<Result<number>> {
  console.log("[Seeding] Seeding demo competitions");
  const seed_competitions = create_seed_competitions(
    entity_id_lookups.competition_format_ids,
  );
  const result = await competition_repository.seed_with_data(seed_competitions);
  if (!result.success) {
    console.error(`[Seeding] Competition seeding failed: ${result.error}`);
    return create_failure_result(`Competition seeding failed: ${result.error}`);
  }
  emit_entity_created_events("competition", seed_competitions, (c) => c.name);
  console.log(`[Seeding] Seeded ${seed_competitions.length} competitions`);
  return create_success_result(seed_competitions.length);
}

export async function seed_demo_competition_stages(
  competition_stage_repository: InBrowserCompetitionStageRepository,
): Promise<Result<number>> {
  console.log("[Seeding] Seeding demo competition stages");
  const seed_competition_stages = create_seed_competition_stages();
  const result = await competition_stage_repository.seed_with_data(
    seed_competition_stages,
  );
  if (!result.success) {
    console.error(
      `[Seeding] Competition stage seeding failed: ${result.error}`,
    );
    return create_failure_result(
      `Competition stage seeding failed: ${result.error}`,
    );
  }
  emit_entity_created_events(
    "competition_stage",
    seed_competition_stages,
    (s) => `${s.name} (${s.competition_id})`,
  );
  console.log(
    `[Seeding] Seeded ${seed_competition_stages.length} competition stages`,
  );
  return create_success_result(seed_competition_stages.length);
}
