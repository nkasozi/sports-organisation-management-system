import { afterEach, describe, expect, it, vi } from "vitest";

async function import_local_auth_secret_key_module(browser: boolean) {
  vi.resetModules();
  vi.doMock("$app/environment", () => ({ browser }));
  vi.doMock("$lib/core/types/Result", () => ({
    create_failure_result: (error: string) => ({ success: false, error }),
    create_success_result: (data: string) => ({ success: true, data }),
  }));
  return import("./localAuthenticationSessionKey");
}

afterEach(() => {
  delete process.env.AUTH_SECRET_KEY;
  vi.doUnmock("$app/environment");
  vi.doUnmock("$lib/core/types/Result");
  vi.resetModules();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("localAuthenticationSessionKey", () => {
  it("returns the configured server secret outside the browser", async () => {
    process.env.AUTH_SECRET_KEY = "server_secret_key";
    const module = await import_local_auth_secret_key_module(false);

    expect(module.get_local_auth_secret_key()).toEqual({
      success: true,
      data: "server_secret_key",
    });
  });

  it("returns a failure result when the server secret is missing", async () => {
    const console_error = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const module = await import_local_auth_secret_key_module(false);
    const result = module.get_local_auth_secret_key();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("AUTH_SECRET_KEY");
    }
    expect(console_error).toHaveBeenCalled();
  });

  it("reuses the existing session key in a browser environment", async () => {
    const get_item = vi.fn().mockReturnValue("existing_session_key");
    const set_item = vi.fn();
    vi.stubGlobal("sessionStorage", {
      getItem: get_item,
      setItem: set_item,
    });

    const module = await import_local_auth_secret_key_module(true);

    expect(module.get_local_auth_secret_key()).toEqual({
      success: true,
      data: "existing_session_key",
    });
    expect(set_item).not.toHaveBeenCalled();
  });

  it("generates and stores a new session key when none exists", async () => {
    const get_item = vi.fn().mockReturnValue(null);
    const set_item = vi.fn();
    vi.stubGlobal("sessionStorage", {
      getItem: get_item,
      setItem: set_item,
    });
    vi.stubGlobal("crypto", {
      getRandomValues: (typed_array: Uint8Array): Uint8Array => {
        typed_array.set(
          Uint8Array.from({ length: typed_array.length }, (_, index) => index),
        );
        return typed_array;
      },
    });

    const module = await import_local_auth_secret_key_module(true);
    const result = module.get_local_auth_secret_key();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(64);
      expect(set_item).toHaveBeenCalledWith(
        "local_auth_session_key",
        result.data,
      );
    }
  });
});
