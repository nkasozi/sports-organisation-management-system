import { get } from "svelte/store";

import { clerk_session } from "../../adapters/iam/clerkAuthService";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type { SystemUser } from "../../core/entities/SystemUser";
import {
  type EmailAddress,
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
import {
  bind_repository_to_origin,
  type RepositoryWriteOrigin,
} from "../repositories/InBrowserRepositoryWriteOrigin";
import { get_system_user_repository } from "../repositories/InBrowserSystemUserRepository";
import { CLERK_USER_STATE_STATUS } from "./initializationConstants";
import {
  INITIALIZATION_ERROR_CODE,
  INITIALIZATION_EVENT,
} from "./initializationEvents";
import { INITIALIZATION_ERROR_MESSAGE } from "./initializationMessages";

function fail_user_resolution<T>(
  event: INITIALIZATION_EVENT,
  user_message: string,
  detail: string,
): Result<T> {
  console.warn("[Seeding] Current user could not be resolved", {
    event,
    error_code: INITIALIZATION_ERROR_CODE.CURRENT_USER_UNRESOLVED,
    error: detail,
  });
  return create_failure_result(user_message);
}

function read_clerk_email_address(): Result<EmailAddress> {
  const user_state = get(clerk_session).user_state;
  switch (user_state.status) {
    case CLERK_USER_STATE_STATUS.MISSING:
      return fail_user_resolution(
        INITIALIZATION_EVENT.NO_CLERK_SESSION,
        INITIALIZATION_ERROR_MESSAGE.NO_CLERK_SESSION,
        INITIALIZATION_ERROR_MESSAGE.NO_CLERK_SESSION,
      );
    case CLERK_USER_STATE_STATUS.PRESENT: {
      const email_result = parse_email_address(
        user_state.user.email_address.toLowerCase(),
        INITIALIZATION_ERROR_MESSAGE.CLERK_EMAIL_INVALID,
      );
      if (email_result.success) return email_result;
      return fail_user_resolution(
        INITIALIZATION_EVENT.CLERK_EMAIL_INVALID,
        INITIALIZATION_ERROR_MESSAGE.CLERK_EMAIL_INVALID,
        email_result.error,
      );
    }
  }
}

async function find_system_user_by_email(
  email: EmailAddress,
): Promise<Result<SystemUser>> {
  const repository = get_repository_container().system_user_repository;
  const by_email_result = await repository.find_by_email(email);
  if (!by_email_result.success) {
    return fail_user_resolution(
      INITIALIZATION_EVENT.SYSTEM_USER_LOOKUP_FAILED,
      INITIALIZATION_ERROR_MESSAGE.SYSTEM_USER_LOOKUP_FAILED,
      by_email_result.error,
    );
  }
  const [matched_user] = by_email_result.data.items;
  if (!matched_user) {
    return fail_user_resolution(
      INITIALIZATION_EVENT.SYSTEM_USER_NOT_FOUND,
      INITIALIZATION_ERROR_MESSAGE.SYSTEM_USER_NOT_FOUND,
      INITIALIZATION_ERROR_MESSAGE.SYSTEM_USER_NOT_FOUND,
    );
  }
  return create_success_result(matched_user);
}

async function apply_current_user(
  user: SystemUser,
): Promise<Result<SystemUser>> {
  set_user_context({
    user_id: user.id,
    user_email: user.email,
    user_display_name: `${user.first_name} ${user.last_name}`,
    organization_id: user.organization_id,
  });
  try {
    await current_user_store.set_user(user);
  } catch (error) {
    console.error("[Seeding] Failed to set current user", {
      event: INITIALIZATION_EVENT.SET_CURRENT_USER_FAILED,
      error_code: INITIALIZATION_ERROR_CODE.SET_CURRENT_USER_FAILED,
      user_id: user.id,
      organization_id: user.organization_id,
      error: String(error),
    });
    return create_failure_result(
      INITIALIZATION_ERROR_MESSAGE.SET_CURRENT_USER_FAILED,
    );
  }
  console.log("[Seeding] Current user resolved", {
    event: INITIALIZATION_EVENT.CURRENT_USER_RESOLVED,
    user_id: user.id,
    organization_id: user.organization_id,
    role: user.role,
  });
  return create_success_result(user);
}

export async function load_and_set_current_user(): Promise<Result<SystemUser>> {
  const email_result = read_clerk_email_address();
  if (!email_result.success) return email_result;
  const user_result = await find_system_user_by_email(email_result.data);
  if (!user_result.success) return user_result;
  return apply_current_user(user_result.data);
}

function fail_super_admin_seed(
  event: INITIALIZATION_EVENT,
  detail: string,
): Result<ScalarInput<SystemUser>> {
  console.error("[Seeding] Failed to seed super admin user", {
    event,
    error_code: INITIALIZATION_ERROR_CODE.SUPER_ADMIN_SEED_FAILED,
    user_id: SEED_SYSTEM_USER_IDS.SYSTEM_ADMINISTRATOR,
    error: detail,
  });
  return create_failure_result(
    INITIALIZATION_ERROR_MESSAGE.SUPER_ADMIN_SEED_FAILED,
  );
}

export async function seed_super_admin_user(
  origin: RepositoryWriteOrigin,
): Promise<Result<ScalarInput<SystemUser>>> {
  const seed_users = create_seed_system_users();
  const seed_result = await bind_repository_to_origin(
    get_system_user_repository(),
    origin,
  ).seed_with_data(seed_users);
  if (!seed_result.success) {
    return fail_super_admin_seed(
      INITIALIZATION_EVENT.SUPER_ADMIN_SEED_FAILED,
      seed_result.error,
    );
  }
  const super_admin = seed_users.find(
    (user) => user.id === SEED_SYSTEM_USER_IDS.SYSTEM_ADMINISTRATOR,
  );
  if (!super_admin) {
    return fail_super_admin_seed(
      INITIALIZATION_EVENT.SUPER_ADMIN_MISSING,
      INITIALIZATION_ERROR_MESSAGE.SUPER_ADMIN_SEED_FAILED,
    );
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
