import type { Activity, CreateActivityInput } from "../entities/Activity";
import type { ActivityCategoryType } from "../entities/ActivityCategory";
import type {
  ActivityCategoryRepository,
  ActivityRepository,
} from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type { AsyncResult, Result } from "../types/Result";
import { create_failure_result, create_success_result } from "../types/Result";

export type ExistingSyncedActivityState =
  | { status: "missing" }
  | { status: "existing"; activity: Activity };

export async function find_activity_category_by_type(
  category_repository: ActivityCategoryRepository,
  organization_id: ScalarValueInput<Activity["organization_id"]>,
  category_type: ActivityCategoryType,
): Promise<Result<Activity["category_id"]>> {
  const result = await category_repository.find_by_category_type(
    organization_id,
    category_type,
  );
  if (result.success && result.data?.items && result.data.items.length > 0) {
    return create_success_result(result.data.items[0].id);
  }
  return create_failure_result(
    `No ${category_type} category found for organization: ${organization_id}`,
  );
}

export async function upsert_synced_activity(
  activity_repository: ActivityRepository,
  existing_activity_state: ExistingSyncedActivityState,
  activity_input: CreateActivityInput,
  update_fields: Partial<Activity>,
): AsyncResult<boolean> {
  if (existing_activity_state.status === "existing") {
    const update_result = await activity_repository.update(
      existing_activity_state.activity.id,
      update_fields,
    );
    return update_result.success
      ? create_success_result(true)
      : create_failure_result(update_result.error);
  }
  const create_result = await activity_repository.create(activity_input);
  return create_result.success
    ? create_success_result(false)
    : create_failure_result(create_result.error);
}
