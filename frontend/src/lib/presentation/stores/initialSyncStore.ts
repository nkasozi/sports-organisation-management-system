import { get, writable } from "svelte/store";

import {
  clerk_session,
  initialize_clerk,
} from "$lib/adapters/iam/clerkAuthService";
import { get_app_settings_storage } from "$lib/infrastructure/container";

export interface InitialSyncState {
  is_syncing: boolean;
  status_message: string;
  progress_percentage: number;
  sync_complete: boolean;
}

const initial_state: InitialSyncState = {
  is_syncing: false,
  status_message: "",
  progress_percentage: 0,
  sync_complete: false,
};

const SESSION_SYNC_KEY = "sports_org_session_synced";
const VERIFIED_SESSION_SYNC_MODE = "verified";
const ANONYMOUS_SESSION_SYNC_MODE = "anonymous";

type SessionSyncState =
  | { status: "missing" }
  | { status: "legacy" }
  | { status: "anonymous" }
  | { status: "verified"; session_id: string };

interface AnonymousSessionSyncMarker {
  mode: typeof ANONYMOUS_SESSION_SYNC_MODE;
}

interface VerifiedSessionSyncMarker {
  mode: typeof VERIFIED_SESSION_SYNC_MODE;
  session_id: string;
}

type StoredSessionSyncMarker =
  | AnonymousSessionSyncMarker
  | VerifiedSessionSyncMarker;

function create_missing_session_sync_state(): SessionSyncState {
  return { status: "missing" };
}

function create_legacy_session_sync_state(): SessionSyncState {
  return { status: "legacy" };
}

function create_anonymous_session_sync_state(): SessionSyncState {
  return { status: "anonymous" };
}

function create_verified_session_sync_state(
  session_id: string,
): SessionSyncState {
  return { status: "verified", session_id };
}

function parse_session_sync_state(raw_value: string): SessionSyncState {
  if (raw_value.length === 0) {
    return create_missing_session_sync_state();
  }

  if (raw_value === "true") {
    return create_legacy_session_sync_state();
  }

  try {
    const parsed_marker = JSON.parse(
      raw_value,
    ) as Partial<StoredSessionSyncMarker>;

    if (parsed_marker.mode === ANONYMOUS_SESSION_SYNC_MODE) {
      return create_anonymous_session_sync_state();
    }

    if (parsed_marker.mode !== VERIFIED_SESSION_SYNC_MODE) {
      return create_missing_session_sync_state();
    }

    if (
      typeof parsed_marker.session_id !== "string" ||
      parsed_marker.session_id.length === 0
    ) {
      return create_missing_session_sync_state();
    }

    return create_verified_session_sync_state(parsed_marker.session_id);
  } catch (error) {
    console.warn("[InitialSync] Failed to parse session sync marker", {
      event: "session_sync_marker_parse_failed",
      error: String(error),
    });

    return create_missing_session_sync_state();
  }
}

function build_anonymous_session_sync_marker(): AnonymousSessionSyncMarker {
  return { mode: ANONYMOUS_SESSION_SYNC_MODE };
}

function build_verified_session_sync_marker(
  session_id: string,
): VerifiedSessionSyncMarker {
  return {
    mode: VERIFIED_SESSION_SYNC_MODE,
    session_id,
  };
}

function build_current_session_sync_marker(): StoredSessionSyncMarker {
  const current_clerk_session = get(clerk_session).session_id_state;

  if (current_clerk_session.status !== "present") {
    return build_anonymous_session_sync_marker();
  }

  return build_verified_session_sync_marker(current_clerk_session.session_id);
}

export async function has_session_been_synced(): Promise<boolean> {
  await initialize_clerk();

  const raw_session_sync_state =
    await get_app_settings_storage().get_setting(SESSION_SYNC_KEY);
  const session_sync_state = parse_session_sync_state(raw_session_sync_state);
  const current_clerk_session = get(clerk_session).session_id_state;

  if (current_clerk_session.status === "present") {
    return (
      session_sync_state.status === "verified" &&
      session_sync_state.session_id === current_clerk_session.session_id
    );
  }

  return session_sync_state.status !== "missing";
}

async function mark_session_synced(): Promise<void> {
  await get_app_settings_storage().set_setting(
    SESSION_SYNC_KEY,
    JSON.stringify(build_current_session_sync_marker()),
  );
}

export async function clear_session_sync_flag(): Promise<void> {
  await get_app_settings_storage().remove_setting(SESSION_SYNC_KEY);
  console.log(
    "[InitialSync] Session sync flag cleared - next login will trigger full sync",
    { event: "session_sync_flag_cleared" },
  );
}

function create_initial_sync_store() {
  const { subscribe, set, update } = writable<InitialSyncState>(initial_state);

  return {
    subscribe,

    start_sync: (): void => {
      set({
        is_syncing: true,
        status_message: "Connecting to server...",
        progress_percentage: 5,
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

    complete_sync: async (): Promise<void> => {
      await mark_session_synced();
      set({
        is_syncing: false,
        status_message: "Ready!",
        progress_percentage: 100,
        sync_complete: true,
      });
    },

    reset: (): void => {
      set(initial_state);
    },
  };
}

export const initial_sync_store = create_initial_sync_store();
