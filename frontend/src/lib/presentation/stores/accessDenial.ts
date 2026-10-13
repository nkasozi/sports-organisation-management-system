import { get, type Readable, writable } from "svelte/store";

interface AccessDenialInfo {
  denied: boolean;
  route: string;
  message: string;
  timestamp: number;
}

const NO_DENIAL_TEXT = "";

const initial_state: AccessDenialInfo = {
  denied: false,
  route: NO_DENIAL_TEXT,
  message: NO_DENIAL_TEXT,
  timestamp: 0,
};

interface AccessDenialStore extends Readable<AccessDenialInfo> {
  set_denial: (route: string, message: string) => void;
  clear: () => void;
  get_and_clear: () => AccessDenialInfo;
}

function create_access_denial_store(): AccessDenialStore {
  const { subscribe, set } = writable<AccessDenialInfo>(initial_state);

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
