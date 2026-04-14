import { get } from "svelte/store";

import { clerk_session } from "../../adapters/iam/clerkAuthService";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type { SystemUser } from "../../core/entities/SystemUser";
import {
  parse_email_address,
  type ScalarInput,
  type ScalarValueInput,
} from "../../core/types/DomainScalars";
import type { Result } from "../../core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "../../core/types/Result";
import { get_repository_container } from "../../infrastructure/container";
import {
  EventBus,
  set_user_context,
} from "../../infrastructure/events/EventBus";
import {
  create_seed_system_users,
  SEED_SYSTEM_USER_IDS,
} from "../../infrastructure/utils/SeedDataGenerator";
import { current_user_store } from "../../presentation/stores/currentUser";
import { get_system_user_repository } from "../repositories/InBrowserSystemUserRepository";

export async function load_and_set_current_user(): Promise<Result<SystemUser>> {
  const container = get_repository_container();
  const system_user_repository = container.system_user_repository;

  const clerk_state = get(clerk_session);
  const clerk_email = clerk_state.user?.email_address?.toLowerCase() ?? null;

  if (!clerk_email) {
    console.log(
      "[Seeding] No Clerk session active — skipping current user resolution",
    );
    return create_failure_result("No Clerk session active");
  }

  const clerk_email_result = parse_email_address(
    clerk_email,
    "Clerk email is invalid",
  );

  if (!clerk_email_result.success) {
    return create_failure_result(clerk_email_result.error);
  }

  const by_email_result = await system_user_repository.find_by_email(
    clerk_email_result.data,
  );

  if (!by_email_result.success || by_email_result.data.items.length === 0) {
    console.warn(
      `[Seeding] No system user found in local DB for Clerk email: ${clerk_email}. ` +
        "Sync may not have completed yet.",
    );
    return create_failure_result(
      `No system user found for email: ${clerk_email}`,
    );
  }

  const matched_user = by_email_result.data.items[0];
  set_user_context({
    user_id: matched_user.id,
    user_email: matched_user.email,
    user_display_name: `${matched_user.first_name} ${matched_user.last_name}`,
    organization_id: matched_user.organization_id,
  });
  current_user_store.set_user(matched_user).catch((error) => {
    console.warn("[SeedingUserSetup] Failed to set user", {
      event: "seeding_set_user_failed",
      error: String(error),
    });
  });
  console.log(
    `[Seeding] Current user resolved: ${matched_user.email} (role: ${matched_user.role})`,
  );
  return create_success_result(matched_user);
}

export async function seed_super_admin_user(): Promise<
  Result<ScalarInput<SystemUser>>
> {
  const system_user_repository = get_system_user_repository();

  const seed_users = create_seed_system_users();
  await system_user_repository.seed_with_data(seed_users);

  const super_admin = seed_users.find(
    (user) => user.id === SEED_SYSTEM_USER_IDS.SYSTEM_ADMINISTRATOR,
  );

  if (!super_admin) {
    console.error("Failed to seed super admin user");
    return create_failure_result("Failed to seed super admin user");
  }

  return create_success_result(super_admin);
}

export function emit_entity_created_events<
  T extends { id: ScalarValueInput<BaseEntity["id"]> },
>(
  entity_type: string,
  entities: T[],
  get_display_name: (entity: T) => string,
): boolean {
  for (const entity of entities) {
    EventBus.emit_entity_created(
      entity_type,
      entity.id,
      get_display_name(entity),
      entity as unknown as Record<string, unknown>,
    );
  }
  return true;
}
