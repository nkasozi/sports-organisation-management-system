import { get_organization_use_cases } from "$lib/core/usecases/OrganizationUseCases";
import { get_competition_use_cases } from "$lib/core/usecases/CompetitionUseCases";
import { get_team_use_cases } from "$lib/core/usecases/TeamUseCases";
import { get_player_use_cases } from "$lib/core/usecases/PlayerUseCases";
import { get_player_team_membership_use_cases } from "$lib/core/usecases/PlayerTeamMembershipUseCases";
import { get_player_position_use_cases } from "$lib/core/usecases/PlayerPositionUseCases";
import { get_official_use_cases } from "$lib/core/usecases/OfficialUseCases";
import { get_fixture_use_cases } from "$lib/core/usecases/FixtureUseCases";
import { get_competition_format_use_cases } from "$lib/core/usecases/CompetitionFormatUseCases";
import { get_game_event_type_use_cases } from "$lib/core/usecases/GameEventTypeUseCases";
import { get_game_official_role_use_cases } from "$lib/core/usecases/GameOfficialRoleUseCases";
import { get_team_staff_role_use_cases } from "$lib/core/usecases/TeamStaffRoleUseCases";
import { get_team_staff_use_cases } from "$lib/core/usecases/TeamStaffUseCases";
import { get_fixture_lineup_use_cases } from "$lib/core/usecases/FixtureLineupUseCases";
import { get_sport_use_cases } from "$lib/core/usecases/SportUseCases";
import { get_qualification_use_cases } from "$lib/core/usecases/QualificationUseCases";
import { get_venue_use_cases } from "$lib/core/usecases/VenueUseCases";
import { get_identification_type_use_cases } from "$lib/core/usecases/IdentificationTypeUseCases";
import { get_identification_use_cases } from "$lib/core/usecases/IdentificationUseCases";
import type {
  BaseEntity,
  EntityListResult,
  EntityOperationResult,
} from "$lib/core/entities/BaseEntity";

const VALID_ENTITY_TYPE_KEYS = [
  "organization",
  "competition",
  "team",
  "player",
  "playerteammembership",
  "official",
  "fixture",
  "competitionformat",
  "gameeventtype",
  "gameofficialrole",
  "teamstaffrole",
  "teamstaff",
  "fixturelineup",
  "sport",
  "playerposition",
  "qualification",
  "venue",
  "identificationtype",
  "identification",
] as const;

export type EntityTypeKey = (typeof VALID_ENTITY_TYPE_KEYS)[number];

export interface GenericEntityUseCases<T extends BaseEntity = BaseEntity> {
  create(input: Record<string, unknown>): Promise<EntityOperationResult<T>>;
  get_by_id(id: string): Promise<EntityOperationResult<T>>;
  list(
    filter?: Record<string, unknown>,
    options?: { page?: number; page_size?: number },
  ): Promise<
    | EntityListResult<T>
    | { success: true; data: { items: T[]; total_count: number } }
    | { success: false; error: string }
  >;
  update(
    id: string,
    input: Record<string, unknown>,
  ): Promise<EntityOperationResult<T>>;
  delete(id: string): Promise<EntityOperationResult<boolean>>;
}

type UseCasesGetter = () => GenericEntityUseCases;

function create_use_cases_registry(): Record<EntityTypeKey, UseCasesGetter> {
  const registry_definition = {
    ["organization" satisfies EntityTypeKey]:
      get_organization_use_cases as UseCasesGetter,
    ["competition" satisfies EntityTypeKey]:
      get_competition_use_cases as UseCasesGetter,
    ["team" satisfies EntityTypeKey]: get_team_use_cases as UseCasesGetter,
    ["player" satisfies EntityTypeKey]: get_player_use_cases as UseCasesGetter,
    ["playerteammembership" satisfies EntityTypeKey]:
      get_player_team_membership_use_cases as UseCasesGetter,
    ["official" satisfies EntityTypeKey]:
      get_official_use_cases as UseCasesGetter,
    ["fixture" satisfies EntityTypeKey]:
      get_fixture_use_cases as UseCasesGetter,
    ["competitionformat" satisfies EntityTypeKey]:
      get_competition_format_use_cases as UseCasesGetter,
    ["gameeventtype" satisfies EntityTypeKey]:
      get_game_event_type_use_cases as UseCasesGetter,
    ["gameofficialrole" satisfies EntityTypeKey]:
      get_game_official_role_use_cases as UseCasesGetter,
    ["teamstaffrole" satisfies EntityTypeKey]:
      get_team_staff_role_use_cases as UseCasesGetter,
    ["teamstaff" satisfies EntityTypeKey]:
      get_team_staff_use_cases as UseCasesGetter,
    ["fixturelineup" satisfies EntityTypeKey]:
      get_fixture_lineup_use_cases as UseCasesGetter,
    ["sport" satisfies EntityTypeKey]: get_sport_use_cases as UseCasesGetter,
    ["playerposition" satisfies EntityTypeKey]:
      get_player_position_use_cases as UseCasesGetter,
    ["qualification" satisfies EntityTypeKey]:
      get_qualification_use_cases as UseCasesGetter,
    ["venue" satisfies EntityTypeKey]: get_venue_use_cases as UseCasesGetter,
    ["identificationtype" satisfies EntityTypeKey]:
      get_identification_type_use_cases as UseCasesGetter,
    ["identification" satisfies EntityTypeKey]:
      get_identification_use_cases as UseCasesGetter,
  } satisfies Record<EntityTypeKey, UseCasesGetter>;

  return registry_definition;
}

const USE_CASES_REGISTRY = create_use_cases_registry();

export function get_use_cases_for_entity_type(
  entity_type: string,
): GenericEntityUseCases | null {
  if (typeof entity_type !== "string" || entity_type.length === 0) {
    console.error(
      "Invalid or missing entity type for use case lookup:",
      entity_type,
    );
    return null;
  }

  const normalized_type = entity_type.toLowerCase();

  if (!is_valid_entity_type(normalized_type)) {
    console.warn(`Unknown entity type requested: ${entity_type}`);
    return null;
  }

  const getter = USE_CASES_REGISTRY[normalized_type];
  return getter();
}

export function get_all_registered_entity_types(): EntityTypeKey[] {
  return [...VALID_ENTITY_TYPE_KEYS];
}

export function is_valid_entity_type(
  entity_type: string,
): entity_type is EntityTypeKey {
  return VALID_ENTITY_TYPE_KEYS.includes(
    entity_type.toLowerCase() as EntityTypeKey,
  );
}
