import { get, type Readable, writable } from "svelte/store";

import {
  clerk_session,
  initialize_clerk,
} from "$lib/adapters/iam/clerkAuthService";
import type { AsyncResult } from "$lib/core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import { build_active_clerk_identity_state } from "./activeClerkIdentity";
import {
  build_session_sync_marker_for_identity,
  has_identity_completed_session_sync,
} from "./sessionSyncIdentity";
import {
  read_session_sync_state_from_storage,
  remove_session_sync_marker,
  write_session_sync_marker,
} from "./sessionSyncMarker";

export { resolve_current_device_session } from "./deviceSessionStateResolution";
export {
  evaluate_recoverable_session_sync_marker_state,
  get_recoverable_session_sync_marker_state,
  persist_recoverable_session_sync_marker_state,
} from "./recoverableSessionSyncMarker";

export interface InitialSyncState {
  is_syncing: boolean;
  status_message: string;
  progress_percentage: number;
  sync_complete: boolean;
}

const INITIAL_SYNC_MESSAGES = {
  IDLE: "",
  CONNECTING: "Connecting to server...",
  READY: "Ready!",
} as const;

const SYNC_STARTED_PROGRESS_PERCENTAGE = 5;
const SYNC_COMPLETE_PROGRESS_PERCENTAGE = 100;
const SESSION_SYNC_FLAG_CLEARED_EVENT = "session_sync_flag_cleared";
const SESSION_SYNC_MARKER_WRITE_FAILED_EVENT =
  "session_sync_marker_write_failed";
const SESSION_SYNC_MARKER_WRITE_FAILED_MESSAGE =
  "This device could not save that you signed in.";

interface InitialSyncStore extends Readable<InitialSyncState> {
  start_sync: () => void;
  update_progress: (message: string, percentage: number) => void;
  complete_sync: () => AsyncResult<boolean>;
  reset: () => void;
}

const initial_state: InitialSyncState = {
  is_syncing: false,
  status_message: INITIAL_SYNC_MESSAGES.IDLE,
  progress_percentage: 0,
  sync_complete: false,
};

export async function has_session_been_synced(): Promise<boolean> {
  await initialize_clerk();

  return has_identity_completed_session_sync(
    await read_session_sync_state_from_storage(),
    build_active_clerk_identity_state(get(clerk_session)),
  );
}

async function mark_session_synced(): AsyncResult<boolean> {
  try {
    await write_session_sync_marker(
      build_session_sync_marker_for_identity(
        build_active_clerk_identity_state(get(clerk_session)),
      ),
    );
    return create_success_result(true);
  } catch (error) {
    console.error("[InitialSync] Session sync marker could not be saved", {
      event: SESSION_SYNC_MARKER_WRITE_FAILED_EVENT,
      error: String(error),
    });
    return create_failure_result(SESSION_SYNC_MARKER_WRITE_FAILED_MESSAGE);
  }
}

export async function clear_session_sync_flag(): Promise<void> {
  await remove_session_sync_marker();
  console.log("[InitialSync] Session sync flag cleared", {
    event: SESSION_SYNC_FLAG_CLEARED_EVENT,
  });
}

function create_initial_sync_store(): InitialSyncStore {
  const { subscribe, set, update } = writable<InitialSyncState>(initial_state);

  return {
    subscribe,

    start_sync: (): void => {
      set({
        is_syncing: true,
        status_message: INITIAL_SYNC_MESSAGES.CONNECTING,
        progress_percentage: SYNC_STARTED_PROGRESS_PERCENTAGE,
        sync_complete: false,
      });
    },

    update_progress: (message: string, percentage: number): void => {
      update((state) => ({
        ...state,
        status_message: message,
        progress_percentage: percentage,
      }));
    },

    complete_sync: async (): AsyncResult<boolean> => {
      const marker_result = await mark_session_synced();
      if (!marker_result.success) return marker_result;
      set({
        is_syncing: false,
        status_message: INITIAL_SYNC_MESSAGES.READY,
        progress_percentage: SYNC_COMPLETE_PROGRESS_PERCENTAGE,
        sync_complete: true,
      });
      return marker_result;
    },

    reset: (): void => {
      set(initial_state);
    },
  };
}

export const initial_sync_store = create_initial_sync_store();
