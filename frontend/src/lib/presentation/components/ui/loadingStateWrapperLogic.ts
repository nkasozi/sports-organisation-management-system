export const LOADING_STATE = {
  IDLE: "idle",
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
} as const;

export type LoadingStateValue =
  (typeof LOADING_STATE)[keyof typeof LOADING_STATE];

export const LOADING_WRAPPER_VIEW = {
  SPINNER: "spinner",
  ERROR: "error",
  CONTENT: "content",
  CONTENT_WITH_OVERLAY: "content_with_overlay",
  EMPTY: "empty",
} as const;

type LoadingWrapperView =
  (typeof LOADING_WRAPPER_VIEW)[keyof typeof LOADING_WRAPPER_VIEW];

export const LOADING_WRAPPER_DEFAULT_TEXT = {
  ERROR_TITLE: "Something went wrong",
  ERROR_MESSAGE: "An unexpected error occurred",
  LOADING: "Loading...",
} as const;

export function resolve_loading_wrapper_view(
  state: LoadingStateValue,
  show_content_while_loading: boolean,
): LoadingWrapperView {
  switch (state) {
    case LOADING_STATE.IDLE:
      return LOADING_WRAPPER_VIEW.EMPTY;
    case LOADING_STATE.LOADING:
      return show_content_while_loading
        ? LOADING_WRAPPER_VIEW.CONTENT_WITH_OVERLAY
        : LOADING_WRAPPER_VIEW.SPINNER;
    case LOADING_STATE.SUCCESS:
      return LOADING_WRAPPER_VIEW.CONTENT;
    case LOADING_STATE.ERROR:
      return LOADING_WRAPPER_VIEW.ERROR;
  }
}
