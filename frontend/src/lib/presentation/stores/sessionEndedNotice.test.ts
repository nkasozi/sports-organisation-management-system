import { get } from "svelte/store";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  build_session_ended_notice_message,
  create_session_ended_notice_store,
  SESSION_ENDED_NOTICE_STATUS,
} from "./sessionEndedNotice";

describe("session ended notice", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("tells the user how many unsaved changes are waiting to sync", () => {
    expect(build_session_ended_notice_message(3)).toBe(
      "Your session ended. Sign in again to sync 3 unsaved changes, or sign out to discard them.",
    );
    expect(build_session_ended_notice_message(1)).toBe(
      "Your session ended. Sign in again to sync 1 unsaved change, or sign out to discard it.",
    );
  });

  it("shows the notice with the pending change count and hides it on dismiss", () => {
    const store = create_session_ended_notice_store();

    expect(store.show(4)).toBe(true);
    expect(get(store)).toEqual({
      status: SESSION_ENDED_NOTICE_STATUS.VISIBLE,
      unsynced_change_count: 4,
    });
    expect(console.warn).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        event: "session_ended_notice_shown",
        unsynced_change_count: 4,
      }),
    );

    store.dismiss();
    expect(get(store)).toEqual({ status: SESSION_ENDED_NOTICE_STATUS.HIDDEN });
  });

  it("refuses to show the notice without any unsaved changes", () => {
    const store = create_session_ended_notice_store();

    expect(store.show(0)).toBe(false);
    expect(get(store)).toEqual({ status: SESSION_ENDED_NOTICE_STATUS.HIDDEN });
  });
});
