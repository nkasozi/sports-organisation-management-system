import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AppSettingsPort } from "$lib/core/interfaces/ports";
import { create_none_option, create_some_option } from "$lib/core/types/Option";
import { base64_url_encode } from "$lib/infrastructure/utils/JwtTokenUtils";
import { create_mock_storage } from "$lib/presentation/logic/columnPreferences.test_support";

import {
  type CachedSessionTokenDependencies,
  clear_cached_session_token,
  get_cached_or_fresh_session_token,
} from "./clerkCachedSessionToken";

const NOW_MS = 1_800_000_000_000;
const CACHED_TOKEN_SETTING_KEY = "clerk_convex_session_token";

function build_token(expires_in_seconds: number, session_id: string): string {
  return [
    base64_url_encode(JSON.stringify({ alg: "RS256" })),
    base64_url_encode(
      JSON.stringify({
        sid: session_id,
        exp: NOW_MS / 1000 + expires_in_seconds,
      }),
    ),
    "signature",
  ].join(".");
}

const fresh_token = build_token(3600, "sess_1");

function build_dependencies(
  storage: AppSettingsPort,
  overrides: Partial<CachedSessionTokenDependencies> = {},
): CachedSessionTokenDependencies {
  return {
    storage,
    now_ms: () => NOW_MS,
    current_session_id: create_some_option("sess_1"),
    request_fresh_token: vi.fn(async () => ({
      success: true as const,
      data: fresh_token,
    })),
    ...overrides,
  };
}

describe("get_cached_or_fresh_session_token", () => {
  let storage: AppSettingsPort;

  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    storage = create_mock_storage();
  });

  it("uses a saved, unexpired token without asking Clerk", async () => {
    const saved_token = build_token(1800, "sess_1");
    await storage.set_setting(CACHED_TOKEN_SETTING_KEY, saved_token);
    const dependencies = build_dependencies(storage);

    const result = await get_cached_or_fresh_session_token(dependencies, {
      force_refresh: false,
    });

    expect(result).toEqual({ success: true, data: saved_token });
    expect(dependencies.request_fresh_token).not.toHaveBeenCalled();
  });

  it("uses the saved token while Clerk has not reported a session yet", async () => {
    const saved_token = build_token(1800, "sess_1");
    await storage.set_setting(CACHED_TOKEN_SETTING_KEY, saved_token);
    const dependencies = build_dependencies(storage, {
      current_session_id: create_none_option(),
    });

    expect(
      await get_cached_or_fresh_session_token(dependencies, {
        force_refresh: false,
      }),
    ).toEqual({ success: true, data: saved_token });
  });

  it("asks Clerk and saves the token when none is saved", async () => {
    const dependencies = build_dependencies(storage);

    const result = await get_cached_or_fresh_session_token(dependencies, {
      force_refresh: false,
    });

    expect(result).toEqual({ success: true, data: fresh_token });
    expect(await storage.get_setting(CACHED_TOKEN_SETTING_KEY)).toBe(
      fresh_token,
    );
  });

  it.each([
    ["expired", build_token(-10, "sess_1")],
    ["about to expire", build_token(30, "sess_1")],
    ["for another session", build_token(1800, "sess_other")],
    ["unreadable", "not-a-token"],
  ])("asks Clerk when the saved token is %s", async (_label, saved_token) => {
    await storage.set_setting(CACHED_TOKEN_SETTING_KEY, saved_token);
    const dependencies = build_dependencies(storage);

    const result = await get_cached_or_fresh_session_token(dependencies, {
      force_refresh: false,
    });

    expect(result).toEqual({ success: true, data: fresh_token });
    expect(dependencies.request_fresh_token).toHaveBeenCalledTimes(1);
  });

  it("asks Clerk when a refresh is forced, such as after the server rejected the token", async () => {
    await storage.set_setting(
      CACHED_TOKEN_SETTING_KEY,
      build_token(1800, "sess_1"),
    );
    const dependencies = build_dependencies(storage);

    const result = await get_cached_or_fresh_session_token(dependencies, {
      force_refresh: true,
    });

    expect(result).toEqual({ success: true, data: fresh_token });
    expect(dependencies.request_fresh_token).toHaveBeenCalledTimes(1);
  });

  it("returns Clerk's failure when there is no usable saved token", async () => {
    const dependencies = build_dependencies(storage, {
      request_fresh_token: async () => ({
        success: false as const,
        error: "Failed to get Clerk session token",
      }),
    });

    expect(
      await get_cached_or_fresh_session_token(dependencies, {
        force_refresh: false,
      }),
    ).toEqual({ success: false, error: "Failed to get Clerk session token" });
  });

  it("reports, without throwing, when the saved token cannot be cleared", async () => {
    const failing_storage: AppSettingsPort = {
      ...storage,
      remove_setting: () => Promise.reject(new Error("storage offline")),
    };

    expect(await clear_cached_session_token(failing_storage)).toBe(false);
  });

  it("forgets the saved token on sign-out", async () => {
    await storage.set_setting(CACHED_TOKEN_SETTING_KEY, fresh_token);

    expect(await clear_cached_session_token(storage)).toBe(true);
    expect(await storage.get_setting(CACHED_TOKEN_SETTING_KEY)).toBe("");
  });
});
