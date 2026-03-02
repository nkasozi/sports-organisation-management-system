import { writable, get } from "svelte/store";

export interface AccessDenialInfo {
  denied: boolean;
  route: string;
  message: string;
  timestamp: number;
}

const initial_state: AccessDenialInfo = {
  denied: false,
  route: "",
  message: "",
  timestamp: 0,
};

function create_access_denial_store() {
  const { subscribe, set, update } = writable<AccessDenialInfo>(initial_state);

  return {
    subscribe,

    set_denial: (route: string, message: string) => {
      set({
        denied: true,
        route,
        message,
        timestamp: Date.now(),
      });
    },

    clear: () => {
      set(initial_state);
    },

    get_and_clear: (): AccessDenialInfo => {
      const current = get({ subscribe });
      set(initial_state);
      return current;
    },
  };
}

export const access_denial_store = create_access_denial_store();
