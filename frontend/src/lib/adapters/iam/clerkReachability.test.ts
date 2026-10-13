import type { Clerk } from "@clerk/clerk-js";
import { describe, expect, it } from "vitest";

import { CLERK_ERROR_CODE } from "./clerkAuthConstants";
import { CLERK_LIFECYCLE_STATUS } from "./clerkLifecycleState";
import {
  CLERK_REACHABILITY_STATUS,
  resolve_clerk_reachability,
} from "./clerkReachability";

function build_clerk(status: string, loaded: boolean = true): Clerk {
  return { status, loaded } as unknown as Clerk;
}

describe("resolve_clerk_reachability", () => {
  it("confirms Clerk when it is ready, loaded and the browser is online", () => {
    expect(
      resolve_clerk_reachability(
        { status: CLERK_LIFECYCLE_STATUS.READY, clerk: build_clerk("ready") },
        true,
      ),
    ).toEqual({ status: CLERK_REACHABILITY_STATUS.CONFIRMED });
  });

  it("treats a ready Clerk as unreachable while the browser is offline", () => {
    expect(
      resolve_clerk_reachability(
        { status: CLERK_LIFECYCLE_STATUS.READY, clerk: build_clerk("ready") },
        false,
      ),
    ).toEqual({ status: CLERK_REACHABILITY_STATUS.UNREACHABLE });
  });

  it.each(["degraded", "error", "loading"])(
    "treats a Clerk instance reporting %s as unreachable",
    (clerk_status: string) => {
      expect(
        resolve_clerk_reachability(
          {
            status: CLERK_LIFECYCLE_STATUS.READY,
            clerk: build_clerk(clerk_status),
          },
          true,
        ),
      ).toEqual({ status: CLERK_REACHABILITY_STATUS.UNREACHABLE });
    },
  );

  it("treats a Clerk instance that has not finished loading as unreachable", () => {
    expect(
      resolve_clerk_reachability(
        {
          status: CLERK_LIFECYCLE_STATUS.READY,
          clerk: build_clerk("ready", false),
        },
        true,
      ),
    ).toEqual({ status: CLERK_REACHABILITY_STATUS.UNREACHABLE });
  });

  it("treats an unavailable Clerk as unreachable even when online", () => {
    expect(
      resolve_clerk_reachability(
        {
          status: CLERK_LIFECYCLE_STATUS.UNAVAILABLE,
          error_code: CLERK_ERROR_CODE.LOAD_TIMED_OUT,
        },
        true,
      ),
    ).toEqual({ status: CLERK_REACHABILITY_STATUS.UNREACHABLE });
  });

  it.each([
    CLERK_LIFECYCLE_STATUS.UNINITIALIZED,
    CLERK_LIFECYCLE_STATUS.INITIALIZING,
  ])("reports a %s Clerk as still pending", (status) => {
    expect(resolve_clerk_reachability({ status } as never, true)).toEqual({
      status: CLERK_REACHABILITY_STATUS.PENDING,
    });
  });
});
