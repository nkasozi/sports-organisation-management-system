import { writable, derived } from "svelte/store";

type AppConnectionStatus = "online" | "offline" | "unknown";

interface AppStatusState {
  connection_status: AppConnectionStatus;
  offline_reason: string;
}

const initial_state: AppStatusState = {
  connection_status: "unknown",
  offline_reason: "",
};

function create_app_status_store() {
  const { subscribe, set, update } = writable<AppStatusState>(initial_state);

  return {
    subscribe,

    set_online: (): void => {
      set({ connection_status: "online", offline_reason: "" });
    },

    set_offline: (reason: string): void => {
      set({ connection_status: "offline", offline_reason: reason });
    },

    reset: (): void => {
      set(initial_state);
    },
  };
}

export const app_status_store = create_app_status_store();

export const is_offline_mode = derived(
  app_status_store,
  ($status) => $status.connection_status === "offline",
);

export const offline_reason = derived(
  app_status_store,
  ($status) => $status.offline_reason,
);
