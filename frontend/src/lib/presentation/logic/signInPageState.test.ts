import { describe, expect, it } from "vitest";

import { get_sign_in_page_error_state } from "./signInPageState";

describe("signInPageState", () => {
  it("marks server_unavailable as a server error only", () => {
    const result = get_sign_in_page_error_state(
      new URL("https://example.com/sign-in?error=server_unavailable"),
    );

    expect(result.error_param_state).toEqual({
      status: "present",
      value: "server_unavailable",
    });
    expect(result.has_server_error).toBe(true);
    expect(result.has_sync_error).toBe(false);
  });

  it("marks non-server errors as sync errors", () => {
    const result = get_sign_in_page_error_state(
      new URL("https://example.com/sign-in?error=sync_failed"),
    );

    expect(result.has_server_error).toBe(false);
    expect(result.has_sync_error).toBe(true);
  });

  it("returns no error flags when the query parameter is missing", () => {
    const result = get_sign_in_page_error_state(
      new URL("https://example.com/sign-in"),
    );

    expect(result.error_param_state).toEqual({ status: "missing" });
    expect(result.has_server_error).toBe(false);
    expect(result.has_sync_error).toBe(false);
  });
});
