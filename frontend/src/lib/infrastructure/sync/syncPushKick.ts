import { sync_engine_runtime } from "./backgroundSyncRuntimeInstance";
import { SyncEngineEventType } from "./syncEngineTypes";

export function request_push_for_reviewed_changes(): boolean {
  sync_engine_runtime.record_local_change();
  console.log("[Sync:Review] Push requested after a review decision", {
    event: "sync_review_push_requested",
    engine_status: sync_engine_runtime.get_machine().state.status,
    trigger: SyncEngineEventType.LOCAL_CHANGE_RECORDED,
  });
  return true;
}
