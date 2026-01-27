import { writable } from "svelte/store";

export interface FirstTimeSetupState {
  is_first_time: boolean;
  is_setting_up: boolean;
  status_message: string;
  progress_percentage: number;
  setup_complete: boolean;
}

const initial_state: FirstTimeSetupState = {
  is_first_time: false,
  is_setting_up: false,
  status_message: "Loading...",
  progress_percentage: 0,
  setup_complete: false,
};

function create_first_time_setup_store() {
  const { subscribe, set, update } =
    writable<FirstTimeSetupState>(initial_state);

  return {
    subscribe,
    set_first_time: (is_first: boolean): void => {
      update((state) => ({ ...state, is_first_time: is_first }));
    },
    start_setup: (): void => {
      update((state) => ({
        ...state,
        is_setting_up: true,
        status_message: "First time use detected...",
        progress_percentage: 5,
      }));
    },
    update_progress: (message: string, percentage: number): void => {
      update((state) => ({
        ...state,
        status_message: message,
        progress_percentage: percentage,
      }));
    },
    complete_setup: (): void => {
      update((state) => ({
        ...state,
        is_setting_up: false,
        setup_complete: true,
        status_message: "Setup complete!",
        progress_percentage: 100,
      }));
    },
    reset: (): void => {
      set(initial_state);
    },
  };
}

export const first_time_setup_store = create_first_time_setup_store();
