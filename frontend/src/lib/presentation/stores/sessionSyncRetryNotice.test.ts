import { get } from "svelte/store";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  create_session_sync_retry_notice_store,
  describe_session_sync_retry_notice,
  SESSION_SYNC_RETRY_KIND,
  SESSION_SYNC_RETRY_STATUS,
} from "./sessionSyncRetryNotice";

describe("session sync retry notice", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("starts hidden and shows the failed sign-in step", () => {
    const store = create_session_sync_retry_notice_store();
    expect(get(store).status).toBe(SESSION_SYNC_RETRY_STATUS.HIDDEN);

    store.show(SESSION_SYNC_RETRY_KIND.PROFILE_UNAVAILABLE);

    expect(get(store)).toEqual({
      status: SESSION_SYNC_RETRY_STATUS.VISIBLE,
      kind: SESSION_SYNC_RETRY_KIND.PROFILE_UNAVAILABLE,
    });
    store.dismiss();
    expect(get(store).status).toBe(SESSION_SYNC_RETRY_STATUS.HIDDEN);
  });

  it.each(Object.values(SESSION_SYNC_RETRY_KIND))(
    "has friendly wording for %s",
    (kind) => {
      const content = describe_session_sync_retry_notice(kind);
      expect(content.title.length).toBeGreaterThan(0);
      expect(content.message).not.toMatch(/convex|clerk|dexie|error/i);
    },
  );
});
