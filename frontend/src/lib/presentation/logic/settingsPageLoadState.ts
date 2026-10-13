export const SETTINGS_PAGE_LOAD_STATUS = {
  LOADING: "loading",
  READY: "ready",
  FAILED: "failed",
} as const;

type SettingsPageLoadState =
  | { status: typeof SETTINGS_PAGE_LOAD_STATUS.LOADING }
  | { status: typeof SETTINGS_PAGE_LOAD_STATUS.READY }
  | { status: typeof SETTINGS_PAGE_LOAD_STATUS.FAILED; error_message: string };

interface SettingsPageLoadStateSink {
  set_is_loading: (value: boolean) => void;
  set_error_message: (value: string) => void;
}

export function mark_settings_page_ready(): SettingsPageLoadState {
  return { status: SETTINGS_PAGE_LOAD_STATUS.READY };
}

export function mark_settings_page_failed(
  error_message: string,
): SettingsPageLoadState {
  return { status: SETTINGS_PAGE_LOAD_STATUS.FAILED, error_message };
}

export function apply_settings_page_load_state(
  sink: SettingsPageLoadStateSink,
  state: SettingsPageLoadState,
): SettingsPageLoadState {
  switch (state.status) {
    case SETTINGS_PAGE_LOAD_STATUS.LOADING:
      sink.set_is_loading(true);
      return state;
    case SETTINGS_PAGE_LOAD_STATUS.READY:
      sink.set_is_loading(false);
      return state;
    case SETTINGS_PAGE_LOAD_STATUS.FAILED:
      sink.set_error_message(state.error_message);
      sink.set_is_loading(false);
      return state;
  }
}
