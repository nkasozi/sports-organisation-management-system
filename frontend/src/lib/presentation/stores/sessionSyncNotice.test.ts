import { get } from "svelte/store";
import { beforeEach, describe, expect, it } from "vitest";

import {
  create_session_sync_notice_store,
  get_session_sync_notice_content,
  SESSION_SYNC_NOTICE_KIND,
  SESSION_SYNC_NOTICE_STATUS,
} from "./sessionSyncNotice";

describe("session sync notice store", () => {
  let notice_store = create_session_sync_notice_store();

  beforeEach(() => {
    notice_store = create_session_sync_notice_store();
  });

  it("starts hidden", () => {
    expect(get(notice_store)).toEqual({
      status: SESSION_SYNC_NOTICE_STATUS.HIDDEN,
    });
  });

  it("shows the requested notice and hides it again on dismiss", () => {
    expect(
      notice_store.show(SESSION_SYNC_NOTICE_KIND.LOCAL_CHANGES_PROTECTED),
    ).toBe(true);
    expect(get(notice_store)).toEqual({
      status: SESSION_SYNC_NOTICE_STATUS.VISIBLE,
      kind: SESSION_SYNC_NOTICE_KIND.LOCAL_CHANGES_PROTECTED,
    });

    expect(notice_store.dismiss()).toBe(true);
    expect(get(notice_store).status).toBe(SESSION_SYNC_NOTICE_STATUS.HIDDEN);
  });

  it.each(Object.values(SESSION_SYNC_NOTICE_KIND))(
    "provides a title and message for %s",
    (kind) => {
      const content = get_session_sync_notice_content(kind);

      expect(content.title.length).toBeGreaterThan(0);
      expect(content.message.length).toBeGreaterThan(0);
    },
  );

  it("tells the user they are still signed in when sign-out cleanup fails", () => {
    expect(
      get_session_sync_notice_content(
        SESSION_SYNC_NOTICE_KIND.SIGN_OUT_CLEANUP_FAILED,
      ).message,
    ).toContain("still signed in");
  });
});
