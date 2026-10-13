import type { Activity, CreateActivityInput } from "../entities/Activity";
import type { ActivityRepository } from "../interfaces/ports";
import { is_activity_not_found_by_source_error } from "../interfaces/ports/external/repositories/ActivityRepository";
import type { ScalarValueInput } from "../types/DomainScalars";
import {
  type ExistingSyncedActivityState,
  SYNC_UPSERT_OUTCOME,
  SYNCED_ACTIVITY_LOOKUP_STATUS,
  type SyncedActivityLookupState,
  type SyncUpsertOutcome,
  upsert_synced_activity,
} from "./ActivitySyncUseCasesHelpers";
import {
  ACTIVITY_SYNC_EVENT,
  ACTIVITY_SYNC_LOG_SCOPE,
} from "./ActivityUseCaseConstants";

export interface SyncedActivityDraft {
  activity_input: CreateActivityInput;
  update_fields: Partial<Activity>;
}

interface ActivitySyncCounts {
  created: number;
  updated: number;
}

type SourceId = ScalarValueInput<Activity["source_id"]>;

interface SourceSyncCommand<TSource> {
  activity_repository: ActivityRepository;
  source_type: Activity["source_type"];
  build_draft: (source: TSource) => Promise<SyncedActivityDraft>;
}

async function lookup_existing_activity(
  activity_repository: ActivityRepository,
  source_type: Activity["source_type"],
  source_id: SourceId,
): Promise<SyncedActivityLookupState> {
  const existing_result = await activity_repository.find_by_source(
    source_type,
    source_id,
  );
  if (existing_result.success)
    return {
      status: SYNCED_ACTIVITY_LOOKUP_STATUS.EXISTING,
      activity: existing_result.data,
    };
  return is_activity_not_found_by_source_error(
    existing_result.error,
    source_type,
    source_id,
  )
    ? { status: SYNCED_ACTIVITY_LOOKUP_STATUS.MISSING }
    : {
        status: SYNCED_ACTIVITY_LOOKUP_STATUS.LOOKUP_FAILED,
        error: existing_result.error,
      };
}

function apply_sync_outcome(
  counts: ActivitySyncCounts,
  outcome: SyncUpsertOutcome,
): ActivitySyncCounts {
  switch (outcome) {
    case SYNC_UPSERT_OUTCOME.CREATED:
      return { ...counts, created: counts.created + 1 };
    case SYNC_UPSERT_OUTCOME.UPDATED:
      return { ...counts, updated: counts.updated + 1 };
  }
}

function log_source_sync_failure(
  event: string,
  source_type: Activity["source_type"],
  source_id: SourceId,
  technical_detail: string,
): void {
  console.error(ACTIVITY_SYNC_LOG_SCOPE, {
    event,
    source_type,
    source_id,
    technical_detail,
  });
}

async function sync_existing_state<TSource extends { id: SourceId }>(
  command: SourceSyncCommand<TSource>,
  source: TSource,
  existing_state: ExistingSyncedActivityState,
  counts: ActivitySyncCounts,
): Promise<ActivitySyncCounts> {
  const draft = await command.build_draft(source);
  const upsert_result = await upsert_synced_activity(
    command.activity_repository,
    existing_state,
    draft.activity_input,
    draft.update_fields,
  );
  if (upsert_result.success)
    return apply_sync_outcome(counts, upsert_result.data);
  log_source_sync_failure(
    ACTIVITY_SYNC_EVENT.UPSERT_FAILED,
    command.source_type,
    source.id,
    upsert_result.error,
  );
  return counts;
}

async function sync_source<TSource extends { id: SourceId }>(
  command: SourceSyncCommand<TSource>,
  source: TSource,
  counts: ActivitySyncCounts,
): Promise<ActivitySyncCounts> {
  const lookup_state = await lookup_existing_activity(
    command.activity_repository,
    command.source_type,
    source.id,
  );
  switch (lookup_state.status) {
    case SYNCED_ACTIVITY_LOOKUP_STATUS.LOOKUP_FAILED:
      log_source_sync_failure(
        ACTIVITY_SYNC_EVENT.SOURCE_LOOKUP_FAILED,
        command.source_type,
        source.id,
        lookup_state.error,
      );
      return counts;
    case SYNCED_ACTIVITY_LOOKUP_STATUS.MISSING:
    case SYNCED_ACTIVITY_LOOKUP_STATUS.EXISTING:
      return sync_existing_state(command, source, lookup_state, counts);
  }
}

export async function sync_sources_to_activities<
  TSource extends { id: SourceId },
>(
  activity_repository: ActivityRepository,
  source_type: Activity["source_type"],
  sources: TSource[],
  build_draft: (source: TSource) => Promise<SyncedActivityDraft>,
): Promise<ActivitySyncCounts> {
  const command = { activity_repository, source_type, build_draft };
  let counts: ActivitySyncCounts = { created: 0, updated: 0 };
  for (const source of sources) {
    counts = await sync_source(command, source, counts);
  }
  return counts;
}
