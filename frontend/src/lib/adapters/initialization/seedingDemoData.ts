import type { UntrackedWriteScope } from "$lib/adapters/repositories/syncOutbox/untrackedWriteScopeToken";

import type { SystemUser } from "../../core/entities/SystemUser";
import type { ScalarInput } from "../../core/types/DomainScalars";
import { create_none_option } from "../../core/types/Option";
import type { Result } from "../../core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "../../core/types/Result";
import {
  clear_user_context,
  EventBus,
  set_user_context,
} from "../../infrastructure/events/EventBus";
import { SEED_ORGANIZATION_IDS } from "../../infrastructure/utils/SeedDataGenerator";
import { current_user_store } from "../../presentation/stores/currentUser";
import { get_competition_format_repository } from "../repositories/InBrowserCompetitionFormatRepository";
import {
  get_game_official_role_repository,
  InBrowserGameOfficialRoleRepository,
} from "../repositories/InBrowserGameOfficialRoleRepository";
import { reset_organization_repository } from "../repositories/InBrowserOrganizationRepository";
import {
  get_player_position_repository,
  InBrowserPlayerPositionRepository,
} from "../repositories/InBrowserPlayerPositionRepository";
import {
  create_system_write_origin,
  type RepositoryWriteOrigin,
} from "../repositories/InBrowserRepositoryWriteOrigin";
import { reset_sport_repository } from "../repositories/InBrowserSportRepository";
import {
  get_team_staff_role_repository,
  InBrowserTeamStaffRoleRepository,
} from "../repositories/InBrowserTeamStaffRoleRepository";
import { seed_all_demo_entities } from "./demoSeedingOrchestrator";
import { build_demo_seeding_repos } from "./demoSeedingRepos";
import { INITIALIZATION_EVENT } from "./initializationEvents";
import { seed_default_lookup_entities_with_origin } from "./organizationDefaultsSeeder";
import { load_seed_entity_id_lookups } from "./seedEntityIdLookups";
import { mark_seeding_complete } from "./seedingTypes";
import { seed_super_admin_user } from "./seedingUserSetup";

const SYSTEM_USER_ENTITY_TYPE = "system_user";

function announce_seeded_super_admin(
  super_admin: ScalarInput<SystemUser>,
): boolean {
  set_user_context({
    user_id: super_admin.id,
    user_email: super_admin.email,
    user_display_name: `${super_admin.first_name} ${super_admin.last_name}`,
    organization_id: super_admin.organization_id,
  });
  current_user_store.set_user(super_admin).catch((error) => {
    console.warn("[SeedingService] Failed to set user", {
      event: INITIALIZATION_EVENT.SET_CURRENT_USER_FAILED,
      error: String(error),
    });
  });
  EventBus.emit_entity_created(
    SYSTEM_USER_ENTITY_TYPE,
    super_admin.id,
    `${super_admin.first_name} ${super_admin.last_name}`,
    super_admin as unknown as Record<string, unknown>,
  );
  return true;
}

async function seed_super_admin_and_context(
  origin: RepositoryWriteOrigin,
): Promise<Result<boolean>> {
  const seeded_sports = await reset_sport_repository(origin);
  if (!seeded_sports.success) return create_failure_result(seeded_sports.error);
  const organizations = await reset_organization_repository(
    seeded_sports.data,
    origin,
  );
  if (!organizations.success) return create_failure_result(organizations.error);
  const super_admin_result = await seed_super_admin_user(origin);
  if (!super_admin_result.success) {
    console.error("[Seeding] Failed to create super admin", {
      event: INITIALIZATION_EVENT.SUPER_ADMIN_SEED_FAILED,
      error: super_admin_result.error,
    });
    return create_failure_result(super_admin_result.error);
  }
  return create_success_result(
    announce_seeded_super_admin(super_admin_result.data),
  );
}

async function seed_default_organization_entities(
  origin: RepositoryWriteOrigin,
): Promise<Result<boolean>> {
  const organization_id = SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION;
  const org_seed_result = await seed_default_lookup_entities_with_origin(
    organization_id,
    origin,
    create_none_option(),
  );
  if (!org_seed_result.success)
    return create_failure_result(
      `Org defaults seeding failed: ${org_seed_result.error}`,
    );
  const lookups_result = await load_seed_entity_id_lookups(
    get_player_position_repository() as InBrowserPlayerPositionRepository,
    get_team_staff_role_repository() as InBrowserTeamStaffRoleRepository,
    get_game_official_role_repository() as InBrowserGameOfficialRoleRepository,
    get_competition_format_repository(),
  );
  if (!lookups_result.success)
    return create_failure_result(
      `Entity ID lookup failed: ${lookups_result.error}`,
    );
  const entities_result = await seed_all_demo_entities(
    organization_id,
    lookups_result.data,
    build_demo_seeding_repos(origin),
  );
  return entities_result.success
    ? create_success_result(true)
    : create_failure_result(entities_result.error);
}

export async function seed_demo_data(
  scope: UntrackedWriteScope,
): Promise<Result<boolean>> {
  const origin = create_system_write_origin(scope);
  const log_context = { correlation_id: scope.scope_id };
  console.log("[Seeding] Demo seed started", {
    event: INITIALIZATION_EVENT.DEMO_SEED_STARTED,
    ...log_context,
  });
  const super_admin_result = await seed_super_admin_and_context(origin);
  if (!super_admin_result.success) return super_admin_result;
  const entities_result = await seed_default_organization_entities(origin);
  if (!entities_result.success) return entities_result;
  clear_user_context();
  const marked = await mark_seeding_complete();
  if (!marked.success) return marked;
  console.log("[Seeding] Demo seed completed", {
    event: INITIALIZATION_EVENT.DEMO_SEED_COMPLETED,
    ...log_context,
  });
  return create_success_result(true);
}
