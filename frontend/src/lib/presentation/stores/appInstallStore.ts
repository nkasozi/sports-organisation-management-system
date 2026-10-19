import { derived, type Readable, writable } from "svelte/store";

import { browser } from "$app/environment";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "$lib/core/types/Option";
import {
  type AppInstallState,
  is_ios_safari_user_agent,
  resolve_app_install_state,
} from "$lib/presentation/logic/appInstallState";

interface InstallPromptChoice {
  outcome: "accepted" | "dismissed";
}

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<InstallPromptChoice>;
}

const APP_INSTALL_OUTCOME = {
  ACCEPTED: "accepted",
  DISMISSED: "dismissed",
  UNAVAILABLE: "unavailable",
} as const;

type AppInstallOutcome =
  (typeof APP_INSTALL_OUTCOME)[keyof typeof APP_INSTALL_OUTCOME];

interface AppInstallStoreState {
  install_prompt: Option<InstallPromptEvent>;
  was_installed: boolean;
  is_standalone: boolean;
  is_ios_safari: boolean;
}

interface AppInstallStore extends Readable<AppInstallState> {
  request_install(): Promise<AppInstallOutcome>;
}

const STANDALONE_DISPLAY_QUERY = "(display-mode: standalone)";
const APP_INSTALL_LOG_EVENT = {
  PROMPT_CAPTURED: "app_install_prompt_captured",
  INSTALLED: "app_install_completed",
  PROMPT_FAILED: "app_install_prompt_failed",
} as const;

function is_running_standalone(): boolean {
  const navigator_with_standalone = navigator as Navigator & {
    standalone?: boolean;
  };
  return (
    window.matchMedia(STANDALONE_DISPLAY_QUERY).matches ||
    navigator_with_standalone.standalone === true
  );
}

function read_initial_state(): AppInstallStoreState {
  const is_browser = browser;
  return {
    install_prompt: create_none_option(),
    was_installed: false,
    is_standalone: is_browser && is_running_standalone(),
    is_ios_safari:
      is_browser &&
      is_ios_safari_user_agent(navigator.userAgent, navigator.maxTouchPoints),
  };
}

function listen_for_install_events(
  update: (
    change: (state: AppInstallStoreState) => AppInstallStoreState,
  ) => void,
): void {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    console.log("[AppInstall] Install prompt available", {
      event: APP_INSTALL_LOG_EVENT.PROMPT_CAPTURED,
    });
    update((state) => ({
      ...state,
      install_prompt: create_some_option(event as InstallPromptEvent),
    }));
  });
  window.addEventListener("appinstalled", () => {
    console.log("[AppInstall] App installed", {
      event: APP_INSTALL_LOG_EVENT.INSTALLED,
    });
    update((state) => ({
      ...state,
      install_prompt: create_none_option(),
      was_installed: true,
    }));
  });
}

async function show_install_prompt(
  install_prompt: InstallPromptEvent,
): Promise<AppInstallOutcome> {
  try {
    await install_prompt.prompt();
    const choice = await install_prompt.userChoice;
    return choice.outcome === APP_INSTALL_OUTCOME.ACCEPTED
      ? APP_INSTALL_OUTCOME.ACCEPTED
      : APP_INSTALL_OUTCOME.DISMISSED;
  } catch (error) {
    console.warn("[AppInstall] Install prompt could not be shown", {
      event: APP_INSTALL_LOG_EVENT.PROMPT_FAILED,
      error: String(error),
    });
    return APP_INSTALL_OUTCOME.UNAVAILABLE;
  }
}

function create_app_install_store(): AppInstallStore {
  const state = writable<AppInstallStoreState>(read_initial_state());
  let current = read_initial_state();
  state.subscribe((value) => (current = value));
  if (browser) listen_for_install_events(state.update);
  const install_state = derived(state, (value) =>
    resolve_app_install_state({
      is_standalone: value.is_standalone,
      has_install_prompt: value.install_prompt.status === OptionStatus.SOME,
      is_ios_safari: value.is_ios_safari,
      was_installed: value.was_installed,
    }),
  );
  return {
    subscribe: install_state.subscribe,
    async request_install(): Promise<AppInstallOutcome> {
      if (current.install_prompt.status !== OptionStatus.SOME)
        return APP_INSTALL_OUTCOME.UNAVAILABLE;
      const outcome = await show_install_prompt(current.install_prompt.value);
      state.update((value) => ({
        ...value,
        install_prompt: create_none_option(),
      }));
      return outcome;
    },
  };
}

export const app_install_store = create_app_install_store();
