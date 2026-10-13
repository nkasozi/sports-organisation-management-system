import { describe, expect, it } from "vitest";

import {
  build_sign_in_error_path,
  get_sign_in_notice_content,
  get_sign_in_page_error_state,
  SIGN_IN_ERROR_CODE,
  SIGN_IN_NOTICE_CONTENT_STATUS,
} from "./signInPageState";

describe("signInPageState", () => {
  it("marks server_unavailable as a server error only", () => {
    const result = get_sign_in_page_error_state(
      new URL("https://example.com/sign-in?error=server_unavailable"),
    );

    expect(result.error_param_state).toEqual({
      status: "present",
      value: "server_unavailable",
    });
    expect(result.notice).toBe("server_unavailable");
  });

  it("marks non-server errors as sync errors", () => {
    const result = get_sign_in_page_error_state(
      new URL("https://example.com/sign-in?error=sync_failed"),
    );

    expect(result.notice).toBe("sync_failed");
  });

  it("returns no error flags when the query parameter is missing", () => {
    const result = get_sign_in_page_error_state(
      new URL("https://example.com/sign-in"),
    );

    expect(result.error_param_state).toEqual({ status: "missing" });
    expect(result.notice).toBe("none");
  });
});

describe("signInPageState notices", () => {
  it.each([
    ["server_unavailable", "server_unavailable"],
    ["sync_failed", "sync_failed"],
    ["something_else", "sync_failed"],
    ["unsynced_local_changes", "unsynced_local_changes"],
    ["local_changes_check_failed", "local_changes_check_failed"],
  ])("maps error=%s to the %s notice", (error_code, expected_notice) => {
    const result = get_sign_in_page_error_state(
      new URL(`https://example.com/sign-in?error=${error_code}`),
    );

    expect(result.notice).toBe(expected_notice);
  });

  it("shows no notice without an error parameter", () => {
    expect(
      get_sign_in_page_error_state(new URL("https://example.com/sign-in"))
        .notice,
    ).toBe("none");
  });

  it("does not report unsynced local changes as a sync error", () => {
    const result = get_sign_in_page_error_state(
      new URL("https://example.com/sign-in?error=unsynced_local_changes"),
    );

    expect(result.notice).toBe("unsynced_local_changes");
    expect(Object.keys(result).sort()).toEqual(["error_param_state", "notice"]);
  });
});

describe("get_sign_in_notice_content", () => {
  it("explains that unsynced local changes were kept on the device", () => {
    const content = get_sign_in_notice_content("unsynced_local_changes");

    expect(content.status).toBe("visible");
    if (content.status !== "visible") return;
    expect(content.title).toBe("Sign-In Cancelled");
    expect(content.message).toContain("not been synced");
    expect(content.message).toContain("kept on this device");
  });

  it("explains that the local change check failed and nothing was wiped", () => {
    const content = get_sign_in_notice_content("local_changes_check_failed");

    expect(content.status).toBe(SIGN_IN_NOTICE_CONTENT_STATUS.VISIBLE);
    if (content.status !== SIGN_IN_NOTICE_CONTENT_STATUS.VISIBLE) return;
    expect(content.title).toBe("Sign-In Paused");
    expect(content.message).toContain("could not check");
    expect(content.message).not.toContain("have not been synced");
  });

  it("hides the notice when there is nothing to report", () => {
    expect(get_sign_in_notice_content("none")).toEqual({ status: "hidden" });
  });

  it.each(["server_unavailable", "sync_failed"] as const)(
    "provides visible content for %s",
    (notice) => {
      expect(get_sign_in_notice_content(notice).status).toBe("visible");
    },
  );
});

describe("build_sign_in_error_path", () => {
  it("builds the sign-in path carrying the error code", () => {
    expect(
      build_sign_in_error_path(SIGN_IN_ERROR_CODE.UNSYNCED_LOCAL_CHANGES),
    ).toBe("/sign-in?error=unsynced_local_changes");
  });
});
