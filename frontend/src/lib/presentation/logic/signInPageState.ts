export const SIGN_IN_ERROR_CODE = {
  SERVER_UNAVAILABLE: "server_unavailable",
  SYNC_FAILED: "sync_failed",
  UNSYNCED_LOCAL_CHANGES: "unsynced_local_changes",
  LOCAL_CHANGES_CHECK_FAILED: "local_changes_check_failed",
} as const;

export const SIGN_IN_PAGE_NOTICE = {
  NONE: "none",
  SERVER_UNAVAILABLE: "server_unavailable",
  SYNC_FAILED: "sync_failed",
  UNSYNCED_LOCAL_CHANGES: "unsynced_local_changes",
  LOCAL_CHANGES_CHECK_FAILED: "local_changes_check_failed",
} as const;

export const SIGN_IN_NOTICE_TONE = {
  DANGER: "danger",
  INFO: "info",
  WARNING: "warning",
} as const;

const SIGN_IN_ERROR_PATH_PREFIX = "/sign-in?error=";
const ERROR_SEARCH_PARAM = "error";
export const SIGN_IN_NOTICE_CONTENT_STATUS = {
  HIDDEN: "hidden",
  VISIBLE: "visible",
} as const;
const NOTICE_CONTENT_STATUS = SIGN_IN_NOTICE_CONTENT_STATUS;
const ERROR_PARAM_STATUS = { MISSING: "missing", PRESENT: "present" } as const;

type SignInErrorCode =
  (typeof SIGN_IN_ERROR_CODE)[keyof typeof SIGN_IN_ERROR_CODE];

export type SignInPageNotice =
  (typeof SIGN_IN_PAGE_NOTICE)[keyof typeof SIGN_IN_PAGE_NOTICE];

type VisibleSignInPageNotice = Exclude<
  SignInPageNotice,
  typeof SIGN_IN_PAGE_NOTICE.NONE
>;

export type SignInNoticeTone =
  (typeof SIGN_IN_NOTICE_TONE)[keyof typeof SIGN_IN_NOTICE_TONE];

type SignInNoticeContent =
  | { status: typeof NOTICE_CONTENT_STATUS.HIDDEN }
  | {
      status: typeof NOTICE_CONTENT_STATUS.VISIBLE;
      tone: SignInNoticeTone;
      title: string;
      message: string;
    };

interface SignInPageErrorState {
  error_param_state: SignInPageErrorParamState;
  notice: SignInPageNotice;
}

type SignInPageErrorParamState =
  | { status: typeof ERROR_PARAM_STATUS.MISSING }
  | { status: typeof ERROR_PARAM_STATUS.PRESENT; value: string };

const VISIBLE_NOTICE_CONTENT: Record<
  VisibleSignInPageNotice,
  { tone: SignInNoticeTone; title: string; message: string }
> = {
  [SIGN_IN_PAGE_NOTICE.SERVER_UNAVAILABLE]: {
    tone: SIGN_IN_NOTICE_TONE.DANGER,
    title: "Connection Error",
    message:
      "Unable to connect to the server to load your data. Please check your internet connection and sign in to try again.",
  },
  [SIGN_IN_PAGE_NOTICE.SYNC_FAILED]: {
    tone: SIGN_IN_NOTICE_TONE.INFO,
    title: "Sync Error",
    message:
      "There was a problem syncing your data. Please sign in again to retry.",
  },
  [SIGN_IN_PAGE_NOTICE.UNSYNCED_LOCAL_CHANGES]: {
    tone: SIGN_IN_NOTICE_TONE.WARNING,
    title: "Sign-In Cancelled",
    message:
      "This device has changes that have not been synced. Signing in would have replaced them, so sign-in was cancelled and they were kept on this device. Sign in again and choose to discard them only if you no longer need them.",
  },
  [SIGN_IN_PAGE_NOTICE.LOCAL_CHANGES_CHECK_FAILED]: {
    tone: SIGN_IN_NOTICE_TONE.WARNING,
    title: "Sign-In Paused",
    message:
      "We could not check this device for changes that still need to sync, so sign-in was stopped before anything was replaced. Reload the page and sign in again.",
  },
};

export interface SignInFeatureHighlight {
  icon: "trophy" | "users" | "clock" | "shield";
  title: string;
  description: string;
}

export const sign_in_feature_highlights: SignInFeatureHighlight[] = [
  {
    icon: "trophy",
    title: "Competitions",
    description: "Manage leagues, tournaments and fixtures",
  },
  {
    icon: "users",
    title: "Teams & Players",
    description: "Rosters, transfers and player profiles",
  },
  {
    icon: "clock",
    title: "Live Games",
    description: "Real-time scoring and event tracking",
  },
  {
    icon: "shield",
    title: "Officials",
    description: "Assign and manage match officials",
  },
];

function resolve_sign_in_page_notice(
  error_param_state: SignInPageErrorParamState,
): SignInPageNotice {
  if (error_param_state.status === ERROR_PARAM_STATUS.MISSING)
    return SIGN_IN_PAGE_NOTICE.NONE;
  switch (error_param_state.value) {
    case SIGN_IN_ERROR_CODE.SERVER_UNAVAILABLE:
      return SIGN_IN_PAGE_NOTICE.SERVER_UNAVAILABLE;
    case SIGN_IN_ERROR_CODE.UNSYNCED_LOCAL_CHANGES:
      return SIGN_IN_PAGE_NOTICE.UNSYNCED_LOCAL_CHANGES;
    case SIGN_IN_ERROR_CODE.LOCAL_CHANGES_CHECK_FAILED:
      return SIGN_IN_PAGE_NOTICE.LOCAL_CHANGES_CHECK_FAILED;
    default:
      return SIGN_IN_PAGE_NOTICE.SYNC_FAILED;
  }
}

export function get_sign_in_page_error_state(
  current_url: URL,
): SignInPageErrorState {
  const error_param = current_url.searchParams.get(ERROR_SEARCH_PARAM);
  const error_param_state: SignInPageErrorParamState = error_param
    ? { status: ERROR_PARAM_STATUS.PRESENT, value: error_param }
    : { status: ERROR_PARAM_STATUS.MISSING };

  return {
    error_param_state,
    notice: resolve_sign_in_page_notice(error_param_state),
  };
}

export function get_sign_in_notice_content(
  notice: SignInPageNotice,
): SignInNoticeContent {
  if (notice === SIGN_IN_PAGE_NOTICE.NONE)
    return { status: NOTICE_CONTENT_STATUS.HIDDEN };
  return {
    status: NOTICE_CONTENT_STATUS.VISIBLE,
    ...VISIBLE_NOTICE_CONTENT[notice],
  };
}

export function build_sign_in_error_path(error_code: SignInErrorCode): string {
  return `${SIGN_IN_ERROR_PATH_PREFIX}${error_code}`;
}
