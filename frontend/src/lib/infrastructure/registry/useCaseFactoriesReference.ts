import type { Organization } from "../../core/entities/Organization";
import type { OrganizationSettingsUseCasesPort } from "../../core/interfaces/ports/internal/usecases/OrganizationSettingsUseCasesPort";
import type { GameEventLogUseCases } from "../../core/usecases/GameEventLogUseCases";
import { create_game_event_log_use_cases } from "../../core/usecases/GameEventLogUseCases";
import type { GameEventTypeUseCases } from "../../core/usecases/GameEventTypeUseCases";
import { create_game_event_type_use_cases } from "../../core/usecases/GameEventTypeUseCases";
import type { GameOfficialRoleUseCases } from "../../core/usecases/GameOfficialRoleUseCases";
import { create_game_official_role_use_cases } from "../../core/usecases/GameOfficialRoleUseCases";
import type { GenderUseCases } from "../../core/usecases/GenderUseCases";
import { create_gender_use_cases } from "../../core/usecases/GenderUseCases";
import type { IdentificationTypeUseCases } from "../../core/usecases/IdentificationTypeUseCases";
import { create_identification_type_use_cases } from "../../core/usecases/IdentificationTypeUseCases";
import type { IdentificationUseCases } from "../../core/usecases/IdentificationUseCases";
import { create_identification_use_cases } from "../../core/usecases/IdentificationUseCases";
import type { JerseyColorUseCases } from "../../core/usecases/JerseyColorUseCases";
import { create_jersey_color_use_cases } from "../../core/usecases/JerseyColorUseCases";
import type { LiveGameLogUseCases } from "../../core/usecases/LiveGameLogUseCases";
import { create_live_game_log_use_cases } from "../../core/usecases/LiveGameLogUseCases";
import { create_organization_settings_use_cases } from "../../core/usecases/OrganizationSettingsUseCases";
import type { OrganizationUseCases } from "../../core/usecases/OrganizationUseCases";
import {
  create_organization_use_cases,
  create_organization_use_cases_with_default_seeder,
} from "../../core/usecases/OrganizationUseCases";
import type { QualificationUseCases } from "../../core/usecases/QualificationUseCases";
import { create_qualification_use_cases } from "../../core/usecases/QualificationUseCases";
import type { SportUseCases } from "../../core/usecases/SportUseCases";
import { create_sport_use_cases } from "../../core/usecases/SportUseCases";
import type { VenueUseCases } from "../../core/usecases/VenueUseCases";
import { create_venue_use_cases } from "../../core/usecases/VenueUseCases";
import { get_repository_container } from "../container";

export function get_game_event_log_use_cases(): GameEventLogUseCases {
  return create_game_event_log_use_cases(
    get_repository_container().game_event_log_repository,
  );
}

export function get_game_event_type_use_cases(): GameEventTypeUseCases {
  return create_game_event_type_use_cases(
    get_repository_container().game_event_type_repository,
  );
}

export function get_game_official_role_use_cases(): GameOfficialRoleUseCases {
  return create_game_official_role_use_cases(
    get_repository_container().game_official_role_repository,
  );
}

export function get_gender_use_cases(): GenderUseCases {
  return create_gender_use_cases(get_repository_container().gender_repository);
}

export function get_identification_type_use_cases(): IdentificationTypeUseCases {
  return create_identification_type_use_cases(
    get_repository_container().identification_type_repository,
  );
}

export function get_identification_use_cases(): IdentificationUseCases {
  return create_identification_use_cases(
    get_repository_container().identification_repository,
  );
}

export function get_jersey_color_use_cases(): JerseyColorUseCases {
  return create_jersey_color_use_cases(
    get_repository_container().jersey_color_repository,
  );
}

export function get_live_game_log_use_cases(): LiveGameLogUseCases {
  return create_live_game_log_use_cases(
    get_repository_container().live_game_log_repository,
  );
}

export function get_organization_settings_use_cases(): OrganizationSettingsUseCasesPort {
  return create_organization_settings_use_cases(
    get_repository_container().organization_settings_repository,
  );
}

export function get_organization_use_cases(): OrganizationUseCases {
  return create_organization_use_cases(
    get_repository_container().organization_repository,
  );
}

export function get_organization_with_defaults_use_cases(): OrganizationUseCases {
  return create_organization_use_cases_with_default_seeder(
    get_repository_container().organization_repository,
    async (organization_id: string): Promise<void> => {
      const { seed_default_lookup_entities_for_organization } =
        await import("../../adapters/initialization/organizationDefaultsSeeder");
      await seed_default_lookup_entities_for_organization(organization_id);
    },
  );
}

export function get_qualification_use_cases(): QualificationUseCases {
  return create_qualification_use_cases(
    get_repository_container().qualification_repository,
  );
}

export function get_sport_use_cases(): SportUseCases {
  return create_sport_use_cases(get_repository_container().sport_repository);
}

export function get_venue_use_cases(): VenueUseCases {
  return create_venue_use_cases(get_repository_container().venue_repository);
}
