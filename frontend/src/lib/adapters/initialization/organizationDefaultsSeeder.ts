import {
  get_gender_repository,
  InBrowserGenderRepository,
} from "../repositories/InBrowserGenderRepository";
import {
  get_identification_type_repository,
  InBrowserIdentificationTypeRepository,
} from "../repositories/InBrowserIdentificationTypeRepository";
import {
  get_player_position_repository,
  InBrowserPlayerPositionRepository,
  create_default_player_positions_for_organization,
} from "../repositories/InBrowserPlayerPositionRepository";
import {
  get_game_official_role_repository,
  InBrowserGameOfficialRoleRepository,
  create_default_game_official_roles_for_organization,
} from "../repositories/InBrowserGameOfficialRoleRepository";
import {
  get_game_event_type_repository,
  InBrowserGameEventTypeRepository,
  create_default_game_event_types_for_organization,
} from "../repositories/InBrowserGameEventTypeRepository";
import {
  get_team_staff_role_repository,
  InBrowserTeamStaffRoleRepository,
  create_default_team_staff_roles_for_organization,
} from "../repositories/InBrowserTeamStaffRoleRepository";
import {
  create_seed_genders,
  create_seed_identification_types,
} from "../../infrastructure/utils/SeedDataGenerator";
import type { AsyncResult } from "../../core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "../../core/types/Result";

export interface OrgSeedResult {
  organization_id: string;
  genders_seeded: number;
  identification_types_seeded: number;
  player_positions_seeded: number;
  game_official_roles_seeded: number;
  game_event_types_seeded: number;
  team_staff_roles_seeded: number;
}

async function seed_genders(
  organization_id: string,
  repository: InBrowserGenderRepository,
): AsyncResult<number> {
  console.log(`[OrganizationDefaults] Seeding genders for org: ${organization_id}`);
  const result = await repository.seed_with_data(create_seed_genders(organization_id));
  if (!result.success) {
    console.error(`[OrganizationDefaults] Genders seeding failed: ${result.error}`);
    return create_failure_result(`Genders: ${result.error}`);
  }
  console.log(`[OrganizationDefaults] Genders seeded: ${result.data} records`);
  return result;
}

async function seed_identification_types(
  organization_id: string,
  repository: InBrowserIdentificationTypeRepository,
): AsyncResult<number> {
  console.log(`[OrganizationDefaults] Seeding identification types for org: ${organization_id}`);
  const result = await repository.seed_with_data(create_seed_identification_types(organization_id));
  if (!result.success) {
    console.error(`[OrganizationDefaults] Identification types seeding failed: ${result.error}`);
    return create_failure_result(`IdentificationTypes: ${result.error}`);
  }
  console.log(`[OrganizationDefaults] Identification types seeded: ${result.data} records`);
  return result;
}

async function seed_player_positions(
  organization_id: string,
  repository: InBrowserPlayerPositionRepository,
): AsyncResult<number> {
  console.log(`[OrganizationDefaults] Seeding player positions for org: ${organization_id}`);
  const result = await repository.seed_with_data(
    create_default_player_positions_for_organization(organization_id),
  );
  if (!result.success) {
    console.error(`[OrganizationDefaults] Player positions seeding failed: ${result.error}`);
    return create_failure_result(`PlayerPositions: ${result.error}`);
  }
  console.log(`[OrganizationDefaults] Player positions seeded: ${result.data} records`);
  return result;
}

async function seed_game_official_roles(
  organization_id: string,
  repository: InBrowserGameOfficialRoleRepository,
): AsyncResult<number> {
  console.log(`[OrganizationDefaults] Seeding game official roles for org: ${organization_id}`);
  const result = await repository.seed_with_data(
    create_default_game_official_roles_for_organization(organization_id),
  );
  if (!result.success) {
    console.error(`[OrganizationDefaults] Game official roles seeding failed: ${result.error}`);
    return create_failure_result(`GameOfficialRoles: ${result.error}`);
  }
  console.log(`[OrganizationDefaults] Game official roles seeded: ${result.data} records`);
  return result;
}

async function seed_game_event_types(
  organization_id: string,
  repository: InBrowserGameEventTypeRepository,
): AsyncResult<number> {
  console.log(`[OrganizationDefaults] Seeding game event types for org: ${organization_id}`);
  const result = await repository.seed_with_data(
    create_default_game_event_types_for_organization(organization_id),
  );
  if (!result.success) {
    console.error(`[OrganizationDefaults] Game event types seeding failed: ${result.error}`);
    return create_failure_result(`GameEventTypes: ${result.error}`);
  }
  console.log(`[OrganizationDefaults] Game event types seeded: ${result.data} records`);
  return result;
}

async function seed_team_staff_roles(
  organization_id: string,
  repository: InBrowserTeamStaffRoleRepository,
): AsyncResult<number> {
  console.log(`[OrganizationDefaults] Seeding team staff roles for org: ${organization_id}`);
  const result = await repository.seed_with_data(
    create_default_team_staff_roles_for_organization(organization_id),
  );
  if (!result.success) {
    console.error(`[OrganizationDefaults] Team staff roles seeding failed: ${result.error}`);
    return create_failure_result(`TeamStaffRoles: ${result.error}`);
  }
  console.log(`[OrganizationDefaults] Team staff roles seeded: ${result.data} records`);
  return result;
}

export async function seed_default_lookup_entities_for_organization(
  organization_id: string,
): AsyncResult<OrgSeedResult> {
  console.log(`[OrganizationDefaults] Starting seeding for org: ${organization_id}`);

  const gender_repository = get_gender_repository() as InBrowserGenderRepository;
  const identification_type_repository = get_identification_type_repository() as InBrowserIdentificationTypeRepository;
  const player_position_repository = get_player_position_repository() as InBrowserPlayerPositionRepository;
  const game_official_role_repository = get_game_official_role_repository() as InBrowserGameOfficialRoleRepository;
  const game_event_type_repository = get_game_event_type_repository() as InBrowserGameEventTypeRepository;
  const team_staff_role_repository = get_team_staff_role_repository() as InBrowserTeamStaffRoleRepository;

  const genders_result = await seed_genders(organization_id, gender_repository);
  if (!genders_result.success) {
    return create_failure_result(`Org seeding aborted at step 1/6 (genders): ${genders_result.error}`);
  }

  const identification_types_result = await seed_identification_types(organization_id, identification_type_repository);
  if (!identification_types_result.success) {
    return create_failure_result(`Org seeding aborted at step 2/6 (identification types): ${identification_types_result.error}`);
  }

  const player_positions_result = await seed_player_positions(organization_id, player_position_repository);
  if (!player_positions_result.success) {
    return create_failure_result(`Org seeding aborted at step 3/6 (player positions): ${player_positions_result.error}`);
  }

  const game_official_roles_result = await seed_game_official_roles(organization_id, game_official_role_repository);
  if (!game_official_roles_result.success) {
    return create_failure_result(`Org seeding aborted at step 4/6 (game official roles): ${game_official_roles_result.error}`);
  }

  const game_event_types_result = await seed_game_event_types(organization_id, game_event_type_repository);
  if (!game_event_types_result.success) {
    return create_failure_result(`Org seeding aborted at step 5/6 (game event types): ${game_event_types_result.error}`);
  }

  const team_staff_roles_result = await seed_team_staff_roles(organization_id, team_staff_role_repository);
  if (!team_staff_roles_result.success) {
    return create_failure_result(`Org seeding aborted at step 6/6 (team staff roles): ${team_staff_roles_result.error}`);
  }

  const summary: OrgSeedResult = {
    organization_id,
    genders_seeded: genders_result.data,
    identification_types_seeded: identification_types_result.data,
    player_positions_seeded: player_positions_result.data,
    game_official_roles_seeded: game_official_roles_result.data,
    game_event_types_seeded: game_event_types_result.data,
    team_staff_roles_seeded: team_staff_roles_result.data,
  };

  console.log(
    `[OrganizationDefaults] All 6 steps completed for org: ${organization_id}`,
    summary,
  );
  return create_success_result(summary);
}

