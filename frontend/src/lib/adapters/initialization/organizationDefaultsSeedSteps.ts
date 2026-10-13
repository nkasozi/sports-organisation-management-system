import type { Organization } from "../../core/entities/Organization";
import type { Sport } from "../../core/entities/Sport";
import type { ScalarValueInput } from "../../core/types/DomainScalars";
import type { Option } from "../../core/types/Option";
import type { AsyncResult } from "../../core/types/Result";
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
  get_game_event_type_repository,
  InBrowserGameEventTypeRepository,
} from "../repositories/InBrowserGameEventTypeRepository";
import {
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
  get_player_position_repository,
  InBrowserPlayerPositionRepository,
} from "../repositories/InBrowserPlayerPositionRepository";
import {
  bind_repository_to_origin,
  type RepositoryWriteOrigin,
} from "../repositories/InBrowserRepositoryWriteOrigin";
import {
  create_default_team_staff_roles_for_organization,
  get_team_staff_role_repository,
  InBrowserTeamStaffRoleRepository,
} from "../repositories/InBrowserTeamStaffRoleRepository";
import {
  select_event_types_for_organization,
  select_official_roles_for_organization,
  select_player_positions_for_organization,
} from "./organizationDefaultsSportData";

export type OrgSeedStepName =
  | "genders"
  | "identification_types"
  | "player_positions"
  | "game_official_roles"
  | "game_event_types"
  | "team_staff_roles"
  | "competition_formats";

export type OrgSeedCountKey = `${OrgSeedStepName}_seeded`;

export type OrgSeedResult = {
  organization_id: ScalarValueInput<Organization["id"]>;
} & Record<OrgSeedCountKey, number>;

export interface OrgSeedStep {
  step_name: OrgSeedStepName;
  seed: () => AsyncResult<number>;
}

interface SeedableRepository<T> {
  seed_with_data(data: T[]): AsyncResult<number>;
}

function create_step<T>(
  step_name: OrgSeedStepName,
  repository: SeedableRepository<T>,
  data: T[],
): OrgSeedStep {
  return { step_name, seed: () => repository.seed_with_data(data) };
}

export function build_reference_data_steps(
  organization_id: ScalarValueInput<Organization["id"]>,
  origin: RepositoryWriteOrigin,
  seed_sport: Option<Sport>,
): OrgSeedStep[] {
  return [
    create_step(
      "genders",
      bind_repository_to_origin(
        get_gender_repository() as InBrowserGenderRepository,
        origin,
      ),
      create_seed_genders(organization_id),
    ),
    create_step(
      "identification_types",
      bind_repository_to_origin(
        get_identification_type_repository() as InBrowserIdentificationTypeRepository,
        origin,
      ),
      create_seed_identification_types(organization_id),
    ),
    create_step(
      "player_positions",
      bind_repository_to_origin(
        get_player_position_repository() as InBrowserPlayerPositionRepository,
        origin,
      ),
      select_player_positions_for_organization(organization_id, seed_sport),
    ),
  ];
}

export function build_role_and_format_steps(
  organization_id: ScalarValueInput<Organization["id"]>,
  origin: RepositoryWriteOrigin,
  seed_sport: Option<Sport>,
): OrgSeedStep[] {
  return [
    create_step(
      "game_official_roles",
      bind_repository_to_origin(
        get_game_official_role_repository() as InBrowserGameOfficialRoleRepository,
        origin,
      ),
      select_official_roles_for_organization(organization_id, seed_sport),
    ),
    create_step(
      "game_event_types",
      bind_repository_to_origin(
        get_game_event_type_repository() as InBrowserGameEventTypeRepository,
        origin,
      ),
      select_event_types_for_organization(organization_id, seed_sport),
    ),
    create_step(
      "team_staff_roles",
      bind_repository_to_origin(
        get_team_staff_role_repository() as InBrowserTeamStaffRoleRepository,
        origin,
      ),
      create_default_team_staff_roles_for_organization(organization_id),
    ),
    create_step(
      "competition_formats",
      bind_repository_to_origin(
        get_competition_format_repository() as InBrowserCompetitionFormatRepository,
        origin,
      ),
      create_default_competition_formats_for_organization(organization_id),
    ),
  ];
}
