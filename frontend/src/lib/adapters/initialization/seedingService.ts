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
import type { ProgressCallback } from "../../infrastructure/sync/convexSeedingService";
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
import { reset_sport_repository } from "../repositories/InBrowserSportRepository";
import {
  get_team_staff_role_repository,
  InBrowserTeamStaffRoleRepository,
} from "../repositories/InBrowserTeamStaffRoleRepository";
import { seed_all_demo_entities } from "./demoSeedingOrchestrator";
import { build_demo_seeding_repos } from "./demoSeedingRepos";
import { seed_default_lookup_entities_for_organization } from "./organizationDefaultsSeeder";
import { load_seed_entity_id_lookups } from "./seedEntityIdLookups";
import {
  handle_convex_mandatory,
  handle_convex_with_local_fallback,
  handle_local_only_seeding,
  handle_skip_seeding,
} from "./seedingStrategies";
import {
  is_seeding_already_complete,
  mark_seeding_complete,
  type SeedingStrategy,
  type SeedResult,
} from "./seedingTypes";
import {
  load_and_set_current_user,
  seed_super_admin_user,
} from "./seedingUserSetup";

export type { SeedingStrategy, SeedResult } from "./seedingTypes";
export { is_seeding_already_complete } from "./seedingTypes";

export async function seed_all_data_if_needed(): Promise<Result<boolean>> {
  const seeding_complete = await is_seeding_already_complete();
  if (seeding_complete) {
    const current_user_result = await load_and_set_current_user();
    if (!current_user_result.success) {
      console.warn(
        `[Seeding] Could not resolve current user: ${current_user_result.error}`,
      );
    }
    return create_success_result(true);
  }

  if (typeof window === "undefined") {
    return create_failure_result("Not in browser environment");
  }

  const seeded_sports = await reset_sport_repository();
  await reset_organization_repository(seeded_sports);

  const super_admin_result = await seed_super_admin_user();
  if (!super_admin_result.success) {
    console.error(
      `[SEED] Failed to create super admin: ${super_admin_result.error}`,
    );
    return create_failure_result(super_admin_result.error);
  }

  const super_admin = super_admin_result.data;
  set_user_context({
    user_id: super_admin.id,
    user_email: super_admin.email,
    user_display_name: `${super_admin.first_name} ${super_admin.last_name}`,
    organization_id: super_admin.organization_id,
  });
  current_user_store.set_user(super_admin).catch((error) => {
    console.warn("[SeedingService] Failed to set user", {
      event: "seeding_set_user_failed",
      error: String(error),
    });
  });
  EventBus.emit_entity_created(
    "system_user",
    super_admin.id,
    `${super_admin.first_name} ${super_admin.last_name}`,
    super_admin as unknown as Record<string, unknown>,
  );

  const org_seed_result = await seed_default_lookup_entities_for_organization(
    SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
  );
  if (!org_seed_result.success) {
    return create_failure_result(
      `Org defaults seeding failed: ${org_seed_result.error}`,
    );
  }

  const lookups_result = await load_seed_entity_id_lookups(
    get_player_position_repository() as InBrowserPlayerPositionRepository,
    get_team_staff_role_repository() as InBrowserTeamStaffRoleRepository,
    get_game_official_role_repository() as InBrowserGameOfficialRoleRepository,
    get_competition_format_repository(),
  );
  if (!lookups_result.success) {
    return create_failure_result(
      `Entity ID lookup failed: ${lookups_result.error}`,
    );
  }

  const entities_result = await seed_all_demo_entities(
    SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
    lookups_result.data,
    build_demo_seeding_repos(),
  );
  if (!entities_result.success) {
    return create_failure_result(entities_result.error);
  }

  clear_user_context();
  await mark_seeding_complete();
  return create_success_result(true);
}

export async function seed_from_convex_or_local(
  on_progress: ProgressCallback,
  strategy: SeedingStrategy,
): Promise<SeedResult> {
  switch (strategy) {
    case "skip_seeding":
      return handle_skip_seeding();
    case "local_only":
      return handle_local_only_seeding(on_progress);
    case "convex_first_with_local_fallback":
      return handle_convex_with_local_fallback(on_progress);
    case "convex_mandatory":
      return handle_convex_mandatory(on_progress);
  }
}
