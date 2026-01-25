import { get_organization_use_cases } from "$lib/core/usecases/OrganizationUseCases";
import { get_competition_use_cases } from "$lib/core/usecases/CompetitionUseCases";
import { get_team_use_cases } from "$lib/core/usecases/TeamUseCases";
import { get_player_use_cases } from "$lib/core/usecases/PlayerUseCases";
import { get_player_team_membership_use_cases } from "$lib/core/usecases/PlayerTeamMembershipUseCases";
import { get_player_position_use_cases } from "$lib/core/usecases/PlayerPositionUseCases";
import { get_official_use_cases } from "$lib/core/usecases/OfficialUseCases";
import { get_fixture_use_cases } from "$lib/core/usecases/FixtureUseCases";
import { get_fixture_management_use_cases } from "$lib/core/usecases/FixtureManagementUseCases";
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
import { get_jersey_color_use_cases } from "$lib/core/usecases/JerseyColorUseCases";
import { get_system_user_use_cases } from "$lib/core/usecases/SystemUserUseCases";
import { get_audit_log_use_cases } from "$lib/core/usecases/AuditLogUseCases";
import { get_player_profile_use_cases } from "$lib/core/usecases/PlayerProfileUseCases";
import { get_profile_link_use_cases } from "$lib/core/usecases/ProfileLinkUseCases";
import { EventBus } from "$lib/infrastructure/events/EventBus";
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
  "fixturemanagement",
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
  "jerseycolor",
  "systemuser",
  "auditlog",
  "playerprofile",
  "profilelink",
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
    ["fixturemanagement" satisfies EntityTypeKey]:
      get_fixture_management_use_cases as UseCasesGetter,
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
    ["jerseycolor" satisfies EntityTypeKey]:
      get_jersey_color_use_cases as UseCasesGetter,
    ["systemuser" satisfies EntityTypeKey]:
      get_system_user_use_cases as unknown as UseCasesGetter,
    ["auditlog" satisfies EntityTypeKey]:
      get_audit_log_use_cases as unknown as UseCasesGetter,
    ["playerprofile" satisfies EntityTypeKey]:
      get_player_profile_use_cases as UseCasesGetter,
    ["profilelink" satisfies EntityTypeKey]:
      get_profile_link_use_cases as UseCasesGetter,
  } satisfies Record<EntityTypeKey, UseCasesGetter>;

  return registry_definition;
}

const USE_CASES_REGISTRY = create_use_cases_registry();

function to_record(entity: BaseEntity): Record<string, unknown> {
  return entity as unknown as Record<string, unknown>;
}

const ENTITY_DISPLAY_NAME_GETTERS: Record<
  string,
  (entity: BaseEntity) => string
> = {
  organization: (e) => (to_record(e).name as string) || e.id,
  competition: (e) => (to_record(e).name as string) || e.id,
  team: (e) => (to_record(e).name as string) || e.id,
  player: (e) => {
    const p = to_record(e);
    return `${p.first_name || ""} ${p.last_name || ""}`.trim() || e.id;
  },
  playerteammembership: (e) => e.id,
  official: (e) => {
    const o = to_record(e);
    return `${o.first_name || ""} ${o.last_name || ""}`.trim() || e.id;
  },
  fixture: (e) => {
    const f = to_record(e);
    return (
      `${f.venue || "Fixture"} - Round ${f.round_number || ""}`.trim() || e.id
    );
  },
  fixturemanagement: (e) => e.id,
  competitionformat: (e) => (to_record(e).name as string) || e.id,
  gameeventtype: (e) => (to_record(e).name as string) || e.id,
  gameofficialrole: (e) => (to_record(e).name as string) || e.id,
  teamstaffrole: (e) => (to_record(e).name as string) || e.id,
  teamstaff: (e) => {
    const s = to_record(e);
    return `${s.first_name || ""} ${s.last_name || ""}`.trim() || e.id;
  },
  fixturelineup: (e) => e.id,
  sport: (e) => (to_record(e).name as string) || e.id,
  playerposition: (e) => (to_record(e).name as string) || e.id,
  qualification: (e) => (to_record(e).name as string) || e.id,
  venue: (e) => (to_record(e).name as string) || e.id,
  identificationtype: (e) => (to_record(e).name as string) || e.id,
  identification: (e) => e.id,
  jerseycolor: (e) => (to_record(e).nickname as string) || e.id,
  systemuser: (e) => {
    const u = to_record(e);
    return `${u.first_name || ""} ${u.last_name || ""}`.trim() || e.id;
  },
  auditlog: (e) => e.id,
  playerprofile: (e) => {
    const p = to_record(e);
    return (p.profile_slug as string) || e.id;
  },
  profilelink: (e) => {
    const l = to_record(e);
    return (l.title as string) || (l.platform as string) || e.id;
  },
};

const ENTITIES_TO_SKIP_AUDIT = ["auditlog"];

function get_entity_display_name(
  entity_type: string,
  entity: BaseEntity,
): string {
  const getter = ENTITY_DISPLAY_NAME_GETTERS[entity_type];
  return getter ? getter(entity) : entity.id;
}

function wrap_use_cases_with_events(
  entity_type: string,
  use_cases: GenericEntityUseCases,
): GenericEntityUseCases {
  if (ENTITIES_TO_SKIP_AUDIT.includes(entity_type)) {
    return use_cases;
  }

  const original_create = use_cases.create.bind(use_cases);
  const original_update = use_cases.update.bind(use_cases);
  const original_delete = use_cases.delete.bind(use_cases);
  const original_get_by_id = use_cases.get_by_id.bind(use_cases);

  return {
    ...use_cases,

    async create(
      input: Record<string, unknown>,
    ): Promise<EntityOperationResult<BaseEntity>> {
      const result = await original_create(input);
      if (result.success && result.data) {
        EventBus.emit_entity_created(
          entity_type,
          result.data.id,
          get_entity_display_name(entity_type, result.data),
          result.data as unknown as Record<string, unknown>,
        );
      }
      return result;
    },

    async update(
      id: string,
      input: Record<string, unknown>,
    ): Promise<EntityOperationResult<BaseEntity>> {
      const old_entity_result = await original_get_by_id(id);
      const old_entity = old_entity_result.success
        ? old_entity_result.data
        : undefined;

      const result = await original_update(id, input);

      if (result.success && result.data && old_entity) {
        const old_data = old_entity as unknown as Record<string, unknown>;
        const new_data = result.data as unknown as Record<string, unknown>;
        const changed_fields = Object.keys(input).filter(
          (field) => old_data[field] !== new_data[field],
        );

        if (changed_fields.length > 0) {
          EventBus.emit_entity_updated(
            entity_type,
            result.data.id,
            get_entity_display_name(entity_type, result.data),
            old_data,
            new_data,
            changed_fields,
          );
        }
      }
      return result;
    },

    async delete(id: string): Promise<EntityOperationResult<boolean>> {
      const entity_result = await original_get_by_id(id);
      const entity = entity_result.success ? entity_result.data : undefined;

      const result = await original_delete(id);

      if (result.success && result.data && entity) {
        EventBus.emit_entity_deleted(
          entity_type,
          id,
          get_entity_display_name(entity_type, entity),
          entity as unknown as Record<string, unknown>,
        );
      }
      return result;
    },
  };
}

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
  const use_cases = getter();
  return wrap_use_cases_with_events(normalized_type, use_cases);
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
