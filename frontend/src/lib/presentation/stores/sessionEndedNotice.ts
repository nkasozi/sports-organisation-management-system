import { type Readable, writable } from "svelte/store";

export const SESSION_ENDED_NOTICE_STATUS = {
  HIDDEN: "hidden",
  VISIBLE: "visible",
} as const;

type SessionEndedNoticeState =
  | { status: typeof SESSION_ENDED_NOTICE_STATUS.HIDDEN }
  | {
      status: typeof SESSION_ENDED_NOTICE_STATUS.VISIBLE;
      unsynced_change_count: number;
    };

interface SessionEndedNoticeStore extends Readable<SessionEndedNoticeState> {
  show(unsynced_change_count: number): boolean;
  dismiss(): boolean;
}

const SESSION_ENDED_NOTICE_SHOWN_EVENT = "session_ended_notice_shown";
const SESSION_ENDED_NOTICE_REJECTED_EVENT = "session_ended_notice_rejected";
const SINGLE_CHANGE_TEXT = { noun: "unsaved change", pronoun: "it" } as const;
const MULTIPLE_CHANGES_TEXT = {
  noun: "unsaved changes",
  pronoun: "them",
} as const;

export const SESSION_ENDED_NOTICE_TITLE = "Your session ended";

export function build_session_ended_notice_message(
  unsynced_change_count: number,
): string {
  const text =
    unsynced_change_count === 1 ? SINGLE_CHANGE_TEXT : MULTIPLE_CHANGES_TEXT;
  return `Your session ended. Sign in again to sync ${unsynced_change_count} ${text.noun}, or sign out to discard ${text.pronoun}.`;
}

function create_hidden_state(): SessionEndedNoticeState {
  return { status: SESSION_ENDED_NOTICE_STATUS.HIDDEN };
}

export function create_session_ended_notice_store(): SessionEndedNoticeStore {
  const { subscribe, set } = writable<SessionEndedNoticeState>(
    create_hidden_state(),
  );
  return {
    subscribe,
    show: (unsynced_change_count: number): boolean => {
      if (unsynced_change_count <= 0) {
        console.warn("[SessionEndedNotice] Notice needs unsaved changes", {
          event: SESSION_ENDED_NOTICE_REJECTED_EVENT,
          unsynced_change_count,
        });
        return false;
      }
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
    dismiss: (): boolean => {
      set(create_hidden_state());
      return true;
    },
  };
}

export const session_ended_notice_store = create_session_ended_notice_store();
