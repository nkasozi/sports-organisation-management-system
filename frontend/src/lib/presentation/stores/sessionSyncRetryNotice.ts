import { type Readable, writable } from "svelte/store";

export const SESSION_SYNC_RETRY_STATUS = {
  HIDDEN: "hidden",
  VISIBLE: "visible",
} as const;

export const SESSION_SYNC_RETRY_KIND = {
  PROFILE_UNAVAILABLE: "profile_unavailable",
  ACCOUNT_DATA_UNAVAILABLE: "account_data_unavailable",
  SESSION_NOT_SAVED: "session_not_saved",
} as const;

export type SessionSyncRetryKind =
  (typeof SESSION_SYNC_RETRY_KIND)[keyof typeof SESSION_SYNC_RETRY_KIND];

type SessionSyncRetryState =
  | { status: typeof SESSION_SYNC_RETRY_STATUS.HIDDEN }
  | {
      status: typeof SESSION_SYNC_RETRY_STATUS.VISIBLE;
      kind: SessionSyncRetryKind;
    };

interface SessionSyncRetryContent {
  title: string;
  message: string;
}

interface SessionSyncRetryNoticeStore extends Readable<SessionSyncRetryState> {
  show(kind: SessionSyncRetryKind): boolean;
  dismiss(): boolean;
}

const SESSION_SYNC_RETRY_SHOWN_EVENT = "session_sync_retry_notice_shown";

const SESSION_SYNC_RETRY_CONTENT: Record<
  SessionSyncRetryKind,
  SessionSyncRetryContent
> = {
  [SESSION_SYNC_RETRY_KIND.PROFILE_UNAVAILABLE]: {
    title: "We could not reach the server",
    message:
      "You are signed in, but your profile could not be loaded because the connection dropped or is too slow. Check your connection and try again.",
  },
  [SESSION_SYNC_RETRY_KIND.ACCOUNT_DATA_UNAVAILABLE]: {
    title: "Your data did not finish downloading",
    message:
      "You are signed in, but the connection dropped before all of your data arrived on this device. Check your connection and try again.",
  },
  [SESSION_SYNC_RETRY_KIND.SESSION_NOT_SAVED]: {
    title: "This device could not save your sign-in",
    message:
      "Your data downloaded, but this device could not remember that you signed in, so it would not be available offline. Please try again.",
  },
};

export function describe_session_sync_retry_notice(
  kind: SessionSyncRetryKind,
): SessionSyncRetryContent {
  return SESSION_SYNC_RETRY_CONTENT[kind];
}

export function create_session_sync_retry_notice_store(): SessionSyncRetryNoticeStore {
  const { subscribe, set } = writable<SessionSyncRetryState>({
    status: SESSION_SYNC_RETRY_STATUS.HIDDEN,
  });
  return {
    subscribe,
    show: (kind: SessionSyncRetryKind): boolean => {
      console.warn("[SessionSyncRetry] Sign-in setup needs a retry", {
        event: SESSION_SYNC_RETRY_SHOWN_EVENT,
        kind,
      });
      set({ status: SESSION_SYNC_RETRY_STATUS.VISIBLE, kind });
      return true;
    },
    dismiss: (): boolean => {
      set({ status: SESSION_SYNC_RETRY_STATUS.HIDDEN });
      return true;
    },
  };
}

export const session_sync_retry_notice_store =
  create_session_sync_retry_notice_store();
