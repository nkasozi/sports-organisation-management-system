import { writable } from "svelte/store";

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

export function has_session_been_synced(): boolean {
  if (typeof window === "undefined") return true;
  return sessionStorage.getItem(SESSION_SYNC_KEY) === "true";
}

export function mark_session_synced(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SESSION_SYNC_KEY, "true");
}

export function clear_session_sync_flag(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_SYNC_KEY);
  console.log("[InitialSync] Session sync flag cleared - next login will trigger full sync");
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

    complete_sync: (): void => {
      mark_session_synced();
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
