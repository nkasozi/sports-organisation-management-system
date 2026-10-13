import type {
  ActivityCategory,
  CreateActivityCategoryInput,
} from "../entities/ActivityCategory";
import { create_default_categories_for_organization } from "../entities/ActivityCategory";
import type { ActivityCategoryRepository } from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type { AsyncResult } from "../types/Result";
import { create_success_result } from "../types/Result";
import {
  ACTIVITY_CATEGORY_EVENT,
  ACTIVITY_CATEGORY_LOG_SCOPE,
  ACTIVITY_CATEGORY_MESSAGE,
} from "./ActivityUseCaseConstants";
import {
  create_log_target_builder,
  fail_missing_identifier,
  is_blank_identifier,
  relay_repository_failure,
} from "./FailureRelay";

type OrganizationId = ScalarValueInput<ActivityCategory["organization_id"]>;

const log_target = create_log_target_builder(ACTIVITY_CATEGORY_LOG_SCOPE);

function select_missing_default_categories(
  organization_id: OrganizationId,
  existing_categories: ActivityCategory[],
): CreateActivityCategoryInput[] {
  const existing_types = new Set(
    existing_categories
      .filter((category) => category.is_system_generated)
      .map((category) => category.category_type),
  );
  return create_default_categories_for_organization(organization_id).filter(
    (category) => !existing_types.has(category.category_type),
  );
}

async function create_default_category(
  repository: ActivityCategoryRepository,
  organization_id: OrganizationId,
  category_input: CreateActivityCategoryInput,
): Promise<boolean> {
  const create_result = await repository.create(category_input);
  if (create_result.success) return true;
  console.error(ACTIVITY_CATEGORY_LOG_SCOPE, {
    event: ACTIVITY_CATEGORY_EVENT.DEFAULT_CREATE_FAILED,
    organization_id,
    category_type: category_input.category_type,
    technical_detail: create_result.error,
  });
  return false;
}

export async function ensure_default_categories_exist(
  repository: ActivityCategoryRepository,
  organization_id: OrganizationId,
): AsyncResult<{ categories_created: number }> {
  if (is_blank_identifier(organization_id))
    return fail_missing_identifier(
      log_target(ACTIVITY_CATEGORY_EVENT.ORGANIZATION_ID_MISSING),
      ACTIVITY_CATEGORY_MESSAGE.ORGANIZATION_ID_REQUIRED,
    );
  const existing_result =
    await repository.find_by_organization(organization_id);
  if (!existing_result.success)
    return relay_repository_failure(
      log_target(ACTIVITY_CATEGORY_EVENT.LIST_FAILED, { organization_id }),
      existing_result.error,
    );
  let categories_created = 0;
  for (const category_input of select_missing_default_categories(
    organization_id,
    existing_result.data.items,
  )) {
    const was_created = await create_default_category(
      repository,
      organization_id,
      category_input,
    );
    categories_created += was_created ? 1 : 0;
  }
  return create_success_result({ categories_created });
}
