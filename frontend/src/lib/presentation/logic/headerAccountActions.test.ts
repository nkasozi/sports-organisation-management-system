import type { Mock } from "vitest";
import { describe, expect, it, vi } from "vitest";

import {
  HEADER_LOGOUT_START,
  resolve_header_logout_start,
  resolve_header_profile_team_name,
  run_header_logout,
  switch_header_profile,
} from "./headerAccountActions";

describe("resolve_header_logout_start", () => {
  it("asks for confirmation when signed in", () => {
    expect(resolve_header_logout_start(true)).toBe(
      HEADER_LOGOUT_START.SHOW_WARNING,
    );
  });

  it("goes straight to sign-in when signed out", () => {
    expect(resolve_header_logout_start(false)).toBe(
      HEADER_LOGOUT_START.GO_TO_SIGN_IN,
    );
  });
});

describe("run_header_logout", () => {
  function create_command(teardown_succeeds: boolean): {
    sign_out_and_tear_down_device: Mock;
    show_session_notice: Mock;
  } {
    return {
      sign_out_and_tear_down_device: vi.fn(async () =>
        teardown_succeeds
          ? { success: true as const, data: true }
          : { success: false as const, error: "reset failed" },
      ),
      show_session_notice: vi.fn(() => true),
    };
  }

  it("signs out through the single device teardown and lands on sign-in", async () => {
    const command = create_command(true);

    const result = await run_header_logout(command);

    expect(result.success).toBe(true);
    expect(command.sign_out_and_tear_down_device).toHaveBeenCalledWith(
      "/sign-in",
    );
    expect(command.show_session_notice).not.toHaveBeenCalled();
  });

  it("tells the user sign-out stopped when the device teardown fails", async () => {
    const command = create_command(false);

    const result = await run_header_logout(command);

    expect(result.success).toBe(false);
    expect(command.show_session_notice).toHaveBeenCalledWith(
      "sign_out_cleanup_failed",
    );
  });
});

describe("switch_header_profile", () => {
  function create_command(switched: boolean): {
    switch_profile: Mock;
    invalidate_route_access_cache: Mock;
    invalidate_all: Mock;
    goto: Mock;
  } {
    return {
      switch_profile: vi.fn(async () => switched),
      invalidate_route_access_cache: vi.fn(),
      invalidate_all: vi.fn(async () => {}),
      goto: vi.fn(async () => {}),
    };
  }

  it("reloads route data and returns home after a successful switch", async () => {
    const command = create_command(true);
    const log_spy = vi.spyOn(console, "log").mockImplementation(() => {});

    const switched = await switch_header_profile(command, {
      id: "profile-2",
      role: "org_admin",
    });

    expect(switched).toBe(true);
    expect(command.switch_profile).toHaveBeenCalledWith("profile-2");
    expect(command.invalidate_route_access_cache).toHaveBeenCalled();
    expect(command.invalidate_all).toHaveBeenCalled();
    expect(command.goto).toHaveBeenCalledWith("/", { replaceState: true });
    log_spy.mockRestore();
  });

  it("does nothing else when the switch fails", async () => {
    const command = create_command(false);

    expect(
      await switch_header_profile(command, { id: "profile-2", role: "x" }),
    ).toBe(false);
    expect(command.goto).not.toHaveBeenCalled();
  });
});

describe("resolve_header_profile_team_name", () => {
  it("returns the team name of the present profile", () => {
    expect(
      resolve_header_profile_team_name({
        status: "present",
        profile: { team_name: "Cranes" },
      }),
    ).toBe("Cranes");
  });

  it("returns an empty name when the profile or team name is missing", () => {
    expect(resolve_header_profile_team_name({ status: "missing" })).toBe("");
    expect(
      resolve_header_profile_team_name({
        status: "present",
        profile: { team_name: "" },
      }),
    ).toBe("");
  });
});
