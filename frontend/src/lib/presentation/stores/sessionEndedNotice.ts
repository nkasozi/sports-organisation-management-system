import { type Readable, writable } from "svelte/store";

export const SESSION_ENDED_NOTICE_STATUS = {
  HIDDEN: "hidden",
  VISIBLE: "visible",
  VISIBLE_COUNT_UNKNOWN: "visible_count_unknown",
} as const;

export type SessionEndedNoticeState =
  | { status: typeof SESSION_ENDED_NOTICE_STATUS.HIDDEN }
  | {
      status: typeof SESSION_ENDED_NOTICE_STATUS.VISIBLE;
      unsynced_change_count: number;
    }
  | { status: typeof SESSION_ENDED_NOTICE_STATUS.VISIBLE_COUNT_UNKNOWN };

interface SessionEndedNoticeStore extends Readable<SessionEndedNoticeState> {
  show(unsynced_change_count: number): boolean;
  show_without_count(): boolean;
  dismiss(): boolean;
}

const SESSION_ENDED_NOTICE_SHOWN_EVENT = "session_ended_notice_shown";
const SESSION_ENDED_NOTICE_REJECTED_EVENT = "session_ended_notice_rejected";
const SINGLE_CHANGE_NOUN = "unsynced change";
const MULTIPLE_CHANGES_NOUN = "unsynced changes";

export const SESSION_ENDED_NOTICE_TEXT = {
  TITLE: "Your session has ended",
  DETAIL:
    "You can no longer sync from this device. Continue to clear it and use the demo, or sign in again (signing in also replaces the data on this device).",
  DISCARD_AND_CONTINUE: "Discard changes and continue",
  SIGN_IN_AGAIN: "Sign in again",
  CLEARING: "Clearing this device...",
  UNKNOWN_COUNT_MESSAGE:
    "Your session has ended. Any unsynced changes on this device will be lost.",
} as const;

export function build_session_ended_notice_message(
  unsynced_change_count: number,
): string {
  const noun =
    unsynced_change_count === 1 ? SINGLE_CHANGE_NOUN : MULTIPLE_CHANGES_NOUN;
  return `Your session has ended. ${unsynced_change_count} ${noun} will be lost.`;
}

export function build_session_ended_notice_message_without_count(): string {
  return SESSION_ENDED_NOTICE_TEXT.UNKNOWN_COUNT_MESSAGE;
}

function create_hidden_state(): SessionEndedNoticeState {
  return { status: SESSION_ENDED_NOTICE_STATUS.HIDDEN };
}

function reject_empty_notice(unsynced_change_count: number): false {
  console.warn("[SessionEndedNotice] Notice needs unsynced changes", {
    event: SESSION_ENDED_NOTICE_REJECTED_EVENT,
    unsynced_change_count,
  });
  return false;
}

export function create_session_ended_notice_store(): SessionEndedNoticeStore {
  const { subscribe, set } = writable<SessionEndedNoticeState>(
    create_hidden_state(),
  );
  return {
    subscribe,
    show: (unsynced_change_count: number): boolean => {
      if (unsynced_change_count <= 0)
        return reject_empty_notice(unsynced_change_count);
      console.warn("[SessionEndedNotice] Notice shown", {
        event: SESSION_ENDED_NOTICE_SHOWN_EVENT,
        unsynced_change_count,
      });
      set({
        status: SESSION_ENDED_NOTICE_STATUS.VISIBLE,
        unsynced_change_count,
      });
      return true;
    },
    show_without_count: (): boolean => {
      console.warn("[SessionEndedNotice] Notice shown without a count", {
        event: SESSION_ENDED_NOTICE_SHOWN_EVENT,
      });
      set({ status: SESSION_ENDED_NOTICE_STATUS.VISIBLE_COUNT_UNKNOWN });
      return true;
    },
    dismiss: (): boolean => {
      set(create_hidden_state());
      return true;
    },
  };
}

export const session_ended_notice_store = create_session_ended_notice_store();
