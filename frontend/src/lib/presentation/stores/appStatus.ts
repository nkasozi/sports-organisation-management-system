import { derived, type Readable, writable } from "svelte/store";

const APP_CONNECTION_STATUS = {
  ONLINE: "online",
  OFFLINE: "offline",
  UNKNOWN: "unknown",
} as const;

const NO_OFFLINE_REASON = "";

type AppStatusState =
  | { connection_status: typeof APP_CONNECTION_STATUS.UNKNOWN }
  | { connection_status: typeof APP_CONNECTION_STATUS.ONLINE }
  | {
      connection_status: typeof APP_CONNECTION_STATUS.OFFLINE;
      offline_reason: string;
    };

interface AppStatusStore extends Readable<AppStatusState> {
  set_online: () => void;
  set_offline: (reason: string) => void;
  reset: () => void;
}

const initial_state: AppStatusState = {
  connection_status: APP_CONNECTION_STATUS.UNKNOWN,
};

function create_app_status_store(): AppStatusStore {
  const { subscribe, set } = writable<AppStatusState>(initial_state);

  return {
    subscribe,
    set_online: (): void => {
      set({ connection_status: APP_CONNECTION_STATUS.ONLINE });
    },
    set_offline: (reason: string): void => {
      set({
        connection_status: APP_CONNECTION_STATUS.OFFLINE,
        offline_reason: reason,
      });
    },
    reset: (): void => {
      set(initial_state);
    },
  };
}

function read_offline_reason(state: AppStatusState): string {
  switch (state.connection_status) {
    case APP_CONNECTION_STATUS.OFFLINE:
      return state.offline_reason;
    case APP_CONNECTION_STATUS.ONLINE:
    case APP_CONNECTION_STATUS.UNKNOWN:
      return NO_OFFLINE_REASON;
  }
}

export const app_status_store = create_app_status_store();

export const is_offline_mode = derived(
  app_status_store,
  ($status): boolean =>
    $status.connection_status === APP_CONNECTION_STATUS.OFFLINE,
);

export const offline_reason = derived(app_status_store, read_offline_reason);
