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

export async function seed_default_lookup_entities_for_organization(
  organization_id: string,
): Promise<void> {
  console.log(
    `[OrganizationDefaults] Seeding default lookup entities for org: ${organization_id}`,
  );

  const gender_repository =
    get_gender_repository() as InBrowserGenderRepository;
  const identification_type_repository =
    get_identification_type_repository() as InBrowserIdentificationTypeRepository;
  const player_position_repository =
    get_player_position_repository() as InBrowserPlayerPositionRepository;
  const game_official_role_repository =
    get_game_official_role_repository() as InBrowserGameOfficialRoleRepository;
  const game_event_type_repository =
    get_game_event_type_repository() as InBrowserGameEventTypeRepository;
  const team_staff_role_repository =
    get_team_staff_role_repository() as InBrowserTeamStaffRoleRepository;

  await gender_repository.seed_with_data(create_seed_genders(organization_id));
  await identification_type_repository.seed_with_data(
    create_seed_identification_types(organization_id),
  );
  await player_position_repository.seed_with_data(
    create_default_player_positions_for_organization(organization_id),
  );
  await game_official_role_repository.seed_with_data(
    create_default_game_official_roles_for_organization(organization_id),
  );
  await game_event_type_repository.seed_with_data(
    create_default_game_event_types_for_organization(organization_id),
  );
  await team_staff_role_repository.seed_with_data(
    create_default_team_staff_roles_for_organization(organization_id),
  );

  console.log(
    `[OrganizationDefaults] Finished seeding defaults for org: ${organization_id}`,
  );
}
