import { get } from "svelte/store";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  build_session_ended_notice_message,
  build_session_ended_notice_message_without_count,
  create_session_ended_notice_store,
  SESSION_ENDED_NOTICE_STATUS,
} from "./sessionEndedNotice";

describe("session ended notice", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("tells the user how many unsynced changes will be lost", () => {
    expect(build_session_ended_notice_message(3)).toBe(
      "Your session has ended. 3 unsynced changes will be lost.",
    );
    expect(build_session_ended_notice_message(1)).toBe(
      "Your session has ended. 1 unsynced change will be lost.",
    );
  });

  it("warns without a number when the changes could not be counted", () => {
    const store = create_session_ended_notice_store();

    expect(store.show_without_count()).toBe(true);
    expect(get(store)).toEqual({
      status: SESSION_ENDED_NOTICE_STATUS.VISIBLE_COUNT_UNKNOWN,
    });
    expect(build_session_ended_notice_message_without_count()).toBe(
      "Your session has ended. Any unsynced changes on this device will be lost.",
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
