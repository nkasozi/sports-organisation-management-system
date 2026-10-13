import type { GameEventType } from "../../core/entities/GameEventType";
import type { GameOfficialRole } from "../../core/entities/GameOfficialRole";
import type { Organization } from "../../core/entities/Organization";
import type { PlayerPosition } from "../../core/entities/PlayerPosition";
import type { Sport } from "../../core/entities/Sport";
import { normalize_sport_code } from "../../core/entities/SportEventCatalog";
import {
  build_sport_event_types,
  build_sport_official_roles,
  build_sport_player_positions,
} from "../../core/entities/SportOrganizationDefaults";
import type {
  ScalarInput,
  ScalarValueInput,
} from "../../core/types/DomainScalars";
import { type Option, OptionStatus } from "../../core/types/Option";
import { create_default_game_event_types_for_organization } from "../repositories/InBrowserGameEventTypeRepository";
import { create_default_game_official_roles_for_organization } from "../repositories/InBrowserGameOfficialRoleRepository";
import { create_default_player_positions_for_organization } from "../repositories/InBrowserPlayerPositionRepository";

type OrganizationId = ScalarValueInput<Organization["id"]>;

const FIELD_HOCKEY_SPORT_CODE = "FIELD_HOCKEY";

const SEED_ID_PREFIX = {
  OFFICIAL_ROLE: "role_sport",
  EVENT_TYPE: "game_event_type_sport",
  PLAYER_POSITION: "player_position_sport",
} as const;

function with_seed_identity<T>(
  id_prefix: string,
  organization_id: OrganizationId,
  inputs: readonly object[],
): ScalarInput<T>[] {
  const now = new Date().toISOString();
  return inputs.map(
    (input, index) =>
      ({
        ...input,
        id: `${id_prefix}_${index + 1}_${organization_id}`,
        created_at: now,
        updated_at: now,
      }) as ScalarInput<T>,
  );
}

export function select_official_roles_for_organization(
  organization_id: OrganizationId,
  seed_sport: Option<Sport>,
): ScalarInput<GameOfficialRole>[] {
  switch (seed_sport.status) {
    case OptionStatus.NONE:
      return create_default_game_official_roles_for_organization(
        organization_id,
      );
    case OptionStatus.SOME:
      return with_seed_identity<GameOfficialRole>(
        SEED_ID_PREFIX.OFFICIAL_ROLE,
        organization_id,
        build_sport_official_roles(seed_sport.value, organization_id),
      );
  }
}

export function select_event_types_for_organization(
  organization_id: OrganizationId,
  seed_sport: Option<Sport>,
): ScalarInput<GameEventType>[] {
  switch (seed_sport.status) {
    case OptionStatus.NONE:
      return create_default_game_event_types_for_organization(organization_id);
    case OptionStatus.SOME:
      return with_seed_identity<GameEventType>(
        SEED_ID_PREFIX.EVENT_TYPE,
        organization_id,
        build_sport_event_types(seed_sport.value, organization_id),
      );
  }
}

export function select_player_positions_for_organization(
  organization_id: OrganizationId,
  seed_sport: Option<Sport>,
): ScalarInput<PlayerPosition>[] {
  switch (seed_sport.status) {
    case OptionStatus.NONE:
      return create_default_player_positions_for_organization(organization_id);
    case OptionStatus.SOME:
      return normalize_sport_code(seed_sport.value.code) ===
        FIELD_HOCKEY_SPORT_CODE
        ? create_default_player_positions_for_organization(organization_id)
        : with_seed_identity<PlayerPosition>(
            SEED_ID_PREFIX.PLAYER_POSITION,
            organization_id,
            build_sport_player_positions(seed_sport.value, organization_id),
          );
  }
}
