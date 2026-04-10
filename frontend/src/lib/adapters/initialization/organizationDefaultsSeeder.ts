import type { AsyncResult } from "../../core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "../../core/types/Result";
import {
  create_seed_genders,
  create_seed_identification_types,
} from "../../infrastructure/utils/SeedDataGenerator";
import {
  create_default_competition_formats_for_organization,
  get_competition_format_repository,
  InBrowserCompetitionFormatRepository,
} from "../repositories/InBrowserCompetitionFormatRepository";
import {
  create_default_game_event_types_for_organization,
  get_game_event_type_repository,
  InBrowserGameEventTypeRepository,
} from "../repositories/InBrowserGameEventTypeRepository";
import {
  create_default_game_official_roles_for_organization,
  get_game_official_role_repository,
  InBrowserGameOfficialRoleRepository,
} from "../repositories/InBrowserGameOfficialRoleRepository";
import {
  get_gender_repository,
  InBrowserGenderRepository,
} from "../repositories/InBrowserGenderRepository";
import {
  get_identification_type_repository,
  InBrowserIdentificationTypeRepository,
} from "../repositories/InBrowserIdentificationTypeRepository";
import {
  create_default_player_positions_for_organization,
  get_player_position_repository,
  InBrowserPlayerPositionRepository,
} from "../repositories/InBrowserPlayerPositionRepository";
import {
  create_default_team_staff_roles_for_organization,
  get_team_staff_role_repository,
  InBrowserTeamStaffRoleRepository,
} from "../repositories/InBrowserTeamStaffRoleRepository";

interface OrgSeedResult {
  organization_id: string;
  genders_seeded: number;
  identification_types_seeded: number;
  player_positions_seeded: number;
  game_official_roles_seeded: number;
  game_event_types_seeded: number;
  team_staff_roles_seeded: number;
  competition_formats_seeded: number;
}

interface SeedableRepository<T> {
  seed_with_data(data: T[]): AsyncResult<number>;
}

async function execute_seed_step<T>(
  step_name: string,
  repository: SeedableRepository<T>,
  data: T[],
): AsyncResult<number> {
  console.log(`[OrganizationDefaults] Seeding ${step_name}`, {
    event: "seed_step_start",
    step_name,
  });
  const result = await repository.seed_with_data(data);
  if (!result.success) {
    console.error(`[OrganizationDefaults] ${step_name} seeding failed`, {
      event: "seed_step_failed",
      step_name,
      error: result.error,
    });
    return create_failure_result(`${step_name}: ${result.error}`);
  }
  console.log(`[OrganizationDefaults] ${step_name} seeded`, {
    event: "seed_step_complete",
    step_name,
    count: result.data,
  });
  return result;
}

export async function seed_default_lookup_entities_for_organization(
  organization_id: string,
): AsyncResult<OrgSeedResult> {
  console.log(`[OrganizationDefaults] Starting seeding`, {
    event: "org_seeding_start",
    organization_id,
  });

  const gender_repo = get_gender_repository() as InBrowserGenderRepository;
  const id_type_repo =
    get_identification_type_repository() as InBrowserIdentificationTypeRepository;
  const position_repo =
    get_player_position_repository() as InBrowserPlayerPositionRepository;
  const official_role_repo =
    get_game_official_role_repository() as InBrowserGameOfficialRoleRepository;
  const event_type_repo =
    get_game_event_type_repository() as InBrowserGameEventTypeRepository;
  const staff_role_repo =
    get_team_staff_role_repository() as InBrowserTeamStaffRoleRepository;
  const format_repo =
    get_competition_format_repository() as InBrowserCompetitionFormatRepository;

  const genders_result = await execute_seed_step(
    "genders",
    gender_repo,
    create_seed_genders(organization_id),
  );
  if (!genders_result.success)
    return create_failure_result(
      `Org seeding aborted at step 1/7 (genders): ${genders_result.error}`,
    );

  const id_types_result = await execute_seed_step(
    "identification_types",
    id_type_repo,
    create_seed_identification_types(organization_id),
  );
  if (!id_types_result.success)
    return create_failure_result(
      `Org seeding aborted at step 2/7 (identification types): ${id_types_result.error}`,
    );

  const positions_result = await execute_seed_step(
    "player_positions",
    position_repo,
    create_default_player_positions_for_organization(organization_id),
  );
  if (!positions_result.success)
    return create_failure_result(
      `Org seeding aborted at step 3/7 (player positions): ${positions_result.error}`,
    );

  const official_roles_result = await execute_seed_step(
    "game_official_roles",
    official_role_repo,
    create_default_game_official_roles_for_organization(organization_id),
  );
  if (!official_roles_result.success)
    return create_failure_result(
      `Org seeding aborted at step 4/7 (game official roles): ${official_roles_result.error}`,
    );

  const event_types_result = await execute_seed_step(
    "game_event_types",
    event_type_repo,
    create_default_game_event_types_for_organization(organization_id),
  );
  if (!event_types_result.success)
    return create_failure_result(
      `Org seeding aborted at step 5/7 (game event types): ${event_types_result.error}`,
    );

  const staff_roles_result = await execute_seed_step(
    "team_staff_roles",
    staff_role_repo,
    create_default_team_staff_roles_for_organization(organization_id),
  );
  if (!staff_roles_result.success)
    return create_failure_result(
      `Org seeding aborted at step 6/7 (team staff roles): ${staff_roles_result.error}`,
    );

  const formats_result = await execute_seed_step(
    "competition_formats",
    format_repo,
    create_default_competition_formats_for_organization(organization_id),
  );
  if (!formats_result.success)
    return create_failure_result(
      `Org seeding aborted at step 7/7 (competition formats): ${formats_result.error}`,
    );

  const summary: OrgSeedResult = {
    organization_id,
    genders_seeded: genders_result.data,
    identification_types_seeded: id_types_result.data,
    player_positions_seeded: positions_result.data,
    game_official_roles_seeded: official_roles_result.data,
    game_event_types_seeded: event_types_result.data,
    team_staff_roles_seeded: staff_roles_result.data,
    competition_formats_seeded: formats_result.data,
  };

  console.log(`[OrganizationDefaults] All 7 steps completed`, {
    event: "org_seeding_complete",
    ...summary,
  });
  return create_success_result(summary);
}
