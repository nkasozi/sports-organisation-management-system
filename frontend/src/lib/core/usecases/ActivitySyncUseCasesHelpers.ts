import type { Activity, CreateActivityInput } from "../entities/Activity";
import type { ActivityCategoryType } from "../entities/ActivityCategory";
import type {
  ActivityCategoryRepository,
  ActivityRepository,
} from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type { AsyncResult, Result } from "../types/Result";
import { create_failure_result, create_success_result } from "../types/Result";
import { build_category_type_missing_detail } from "./ActivityUseCaseConstants";

export const SYNCED_ACTIVITY_LOOKUP_STATUS = {
  MISSING: "missing",
  EXISTING: "existing",
  LOOKUP_FAILED: "lookup_failed",
} as const;

export const SYNC_UPSERT_OUTCOME = {
  CREATED: "created",
  UPDATED: "updated",
} as const;

export type SyncUpsertOutcome =
  (typeof SYNC_UPSERT_OUTCOME)[keyof typeof SYNC_UPSERT_OUTCOME];

export type ExistingSyncedActivityState =
  | { status: typeof SYNCED_ACTIVITY_LOOKUP_STATUS.MISSING }
  | {
      status: typeof SYNCED_ACTIVITY_LOOKUP_STATUS.EXISTING;
      activity: Activity;
    };

export type SyncedActivityLookupState =
  | ExistingSyncedActivityState
  | {
      status: typeof SYNCED_ACTIVITY_LOOKUP_STATUS.LOOKUP_FAILED;
      error: string;
    };

export async function find_activity_category_by_type(
  category_repository: ActivityCategoryRepository,
  organization_id: ScalarValueInput<Activity["organization_id"]>,
  category_type: ActivityCategoryType,
): Promise<Result<Activity["category_id"]>> {
  const result = await category_repository.find_by_category_type(
    organization_id,
    category_type,
  );
  const first_category = result.success ? result.data.items.at(0) : undefined;
  if (first_category) return create_success_result(first_category.id);
  return create_failure_result(
    build_category_type_missing_detail(category_type, organization_id),
  );
}

async function settle_upsert(
  pending_result: AsyncResult<Activity>,
  outcome: SyncUpsertOutcome,
): AsyncResult<SyncUpsertOutcome> {
  const result = await pending_result;
  return result.success
    ? create_success_result(outcome)
    : create_failure_result(result.error);
}

export async function upsert_synced_activity(
  activity_repository: ActivityRepository,
  existing_activity_state: ExistingSyncedActivityState,
  activity_input: CreateActivityInput,
  update_fields: Partial<Activity>,
): AsyncResult<SyncUpsertOutcome> {
  switch (existing_activity_state.status) {
    case SYNCED_ACTIVITY_LOOKUP_STATUS.EXISTING:
      return settle_upsert(
        activity_repository.update(
          existing_activity_state.activity.id,
          update_fields,
        ),
        SYNC_UPSERT_OUTCOME.UPDATED,
      );
    case SYNCED_ACTIVITY_LOOKUP_STATUS.MISSING:
      return settle_upsert(
        activity_repository.create(activity_input),
        SYNC_UPSERT_OUTCOME.CREATED,
      );
  }
}
