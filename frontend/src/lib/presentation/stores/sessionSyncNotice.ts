import { type Readable, writable } from "svelte/store";

export const SESSION_SYNC_NOTICE_STATUS = {
  HIDDEN: "hidden",
  VISIBLE: "visible",
} as const;

export const SESSION_SYNC_NOTICE_KIND = {
  LOCAL_CHANGES_PROTECTED: "local_changes_protected",
  LOCAL_CHANGES_CHECK_FAILED: "local_changes_check_failed",
  SIGN_OUT_CLEANUP_FAILED: "sign_out_cleanup_failed",
} as const;

export type SessionSyncNoticeKind =
  (typeof SESSION_SYNC_NOTICE_KIND)[keyof typeof SESSION_SYNC_NOTICE_KIND];

type SessionSyncNoticeState =
  | { status: typeof SESSION_SYNC_NOTICE_STATUS.HIDDEN }
  | {
      status: typeof SESSION_SYNC_NOTICE_STATUS.VISIBLE;
      kind: SessionSyncNoticeKind;
    };

interface SessionSyncNoticeContent {
  title: string;
  message: string;
}

interface SessionSyncNoticeStore extends Readable<SessionSyncNoticeState> {
  show(kind: SessionSyncNoticeKind): boolean;
  dismiss(): boolean;
}

const SESSION_SYNC_NOTICE_SHOWN_EVENT = "session_sync_notice_shown";

const SESSION_SYNC_NOTICE_CONTENT: Record<
  SessionSyncNoticeKind,
  SessionSyncNoticeContent
> = {
  [SESSION_SYNC_NOTICE_KIND.LOCAL_CHANGES_PROTECTED]: {
    title: "Local changes kept",
    message:
      "This device has changes that have not been synced yet, so its data was not reset. Sign in with the account that made them so they can sync.",
  },
  [SESSION_SYNC_NOTICE_KIND.LOCAL_CHANGES_CHECK_FAILED]: {
    title: "Local data left untouched",
    message:
      "We could not check this device for changes that still need to sync, so its data was not reset. Reload the page to try again.",
  },
  [SESSION_SYNC_NOTICE_KIND.SIGN_OUT_CLEANUP_FAILED]: {
    title: "Sign-out did not finish",
    message:
      "This device's data could not be cleared, so sign-out was stopped and you are still signed in. Please try signing out again.",
  },
};

function create_hidden_session_sync_notice_state(): SessionSyncNoticeState {
  return { status: SESSION_SYNC_NOTICE_STATUS.HIDDEN };
}

export function get_session_sync_notice_content(
  kind: SessionSyncNoticeKind,
): SessionSyncNoticeContent {
  return SESSION_SYNC_NOTICE_CONTENT[kind];
}

export function create_session_sync_notice_store(): SessionSyncNoticeStore {
  const { subscribe, set } = writable<SessionSyncNoticeState>(
    create_hidden_session_sync_notice_state(),
  );

  return {
    subscribe,
    show: (kind: SessionSyncNoticeKind): boolean => {
      console.warn("[SessionSyncNotice] Notice shown", {
        event: SESSION_SYNC_NOTICE_SHOWN_EVENT,
        kind,
      });
      set({ status: SESSION_SYNC_NOTICE_STATUS.VISIBLE, kind });
      return true;
    },
    dismiss: (): boolean => {
      set(create_hidden_session_sync_notice_state());
      return true;
    },
  };
}

export const session_sync_notice_store = create_session_sync_notice_store();
