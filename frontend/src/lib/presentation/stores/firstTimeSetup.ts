import { type Readable, writable } from "svelte/store";

export interface FirstTimeSetupState {
  is_first_time: boolean;
  is_setting_up: boolean;
  status_message: string;
  progress_percentage: number;
  setup_complete: boolean;
}

type FirstTimeSetupTransform = (
  state: FirstTimeSetupState,
) => FirstTimeSetupState;

const FIRST_TIME_SETUP_MESSAGES = {
  LOADING: "Loading...",
  FIRST_TIME_DETECTED: "First time use detected...",
  COMPLETE: "Setup complete!",
} as const;

const SETUP_STARTED_PROGRESS_PERCENTAGE = 5;
const SETUP_COMPLETE_PROGRESS_PERCENTAGE = 100;

interface FirstTimeSetupStore extends Readable<FirstTimeSetupState> {
  block_updates: () => void;
  set_first_time: (is_first: boolean) => void;
  start_setup: () => void;
  update_progress: (message: string, percentage: number) => void;
  complete_setup: () => void;
  reset: () => void;
}

const initial_state: FirstTimeSetupState = {
  is_first_time: false,
  is_setting_up: false,
  status_message: FIRST_TIME_SETUP_MESSAGES.LOADING,
  progress_percentage: 0,
  setup_complete: false,
};

let is_updating_blocked = false;

function mark_setup_started(state: FirstTimeSetupState): FirstTimeSetupState {
  return {
    ...state,
    is_setting_up: true,
    status_message: FIRST_TIME_SETUP_MESSAGES.FIRST_TIME_DETECTED,
    progress_percentage: SETUP_STARTED_PROGRESS_PERCENTAGE,
  };
}

function mark_setup_complete(state: FirstTimeSetupState): FirstTimeSetupState {
  return {
    ...state,
    is_setting_up: false,
    setup_complete: true,
    status_message: FIRST_TIME_SETUP_MESSAGES.COMPLETE,
    progress_percentage: SETUP_COMPLETE_PROGRESS_PERCENTAGE,
  };
}

function create_first_time_setup_store(): FirstTimeSetupStore {
  const { subscribe, set, update } =
    writable<FirstTimeSetupState>(initial_state);

  const update_unless_blocked = (transform: FirstTimeSetupTransform): void => {
    if (is_updating_blocked) return;
    update(transform);
  };

  return {
    subscribe,
    block_updates: (): void => {
      is_updating_blocked = true;
    },
    set_first_time: (is_first: boolean): void =>
      update_unless_blocked((state) => ({ ...state, is_first_time: is_first })),
    start_setup: (): void => update_unless_blocked(mark_setup_started),
    update_progress: (message: string, percentage: number): void =>
      update_unless_blocked((state) => ({
        ...state,
        status_message: message,
        progress_percentage: percentage,
      })),
    complete_setup: (): void => update_unless_blocked(mark_setup_complete),
    reset: (): void => {
      is_updating_blocked = false;
      set(initial_state);
    },
  };
}

export const first_time_setup_store = create_first_time_setup_store();
