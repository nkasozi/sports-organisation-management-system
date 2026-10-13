import type { Clerk } from "@clerk/clerk-js";
import { describe, expect, it } from "vitest";

import { CLERK_ERROR_CODE } from "./clerkAuthConstants";
import {
  INITIAL_CLERK_STATE,
  LOADED_SIGNED_OUT_CLERK_STATE,
} from "./clerkAuthTypes";
import {
  CLERK_LIFECYCLE_EVENT,
  CLERK_LIFECYCLE_STATUS,
  INITIAL_CLERK_LIFECYCLE_STATE,
  transition_clerk_lifecycle,
} from "./clerkLifecycleState";
import {
  change_navigation_state,
  CLERK_STORE_DELIVERY_STATUS,
  deliver_clerk_state,
  LIVE_CLERK_STORE_DELIVERY,
} from "./clerkStoreDelivery";

const FAKE_CLERK = { id: "clerk" } as unknown as Clerk;

describe("clerk lifecycle state machine", () => {
  it("moves uninitialized -> initializing -> ready and stays ready on restart", () => {
    const initializing = transition_clerk_lifecycle(
      INITIAL_CLERK_LIFECYCLE_STATE,
      { type: CLERK_LIFECYCLE_EVENT.INITIALIZATION_STARTED },
    );
    const ready = transition_clerk_lifecycle(initializing, {
      type: CLERK_LIFECYCLE_EVENT.CLERK_ACTIVATED,
      clerk: FAKE_CLERK,
    });

    expect(initializing.status).toBe(CLERK_LIFECYCLE_STATUS.INITIALIZING);
    expect(ready).toEqual({
      status: CLERK_LIFECYCLE_STATUS.READY,
      clerk: FAKE_CLERK,
    });
    expect(
      transition_clerk_lifecycle(ready, {
        type: CLERK_LIFECYCLE_EVENT.INITIALIZATION_STARTED,
      }),
    ).toBe(ready);
  });

  it("records why clerk is unavailable and allows a retry", () => {
    const unavailable = transition_clerk_lifecycle(
      INITIAL_CLERK_LIFECYCLE_STATE,
      {
        type: CLERK_LIFECYCLE_EVENT.CLERK_UNAVAILABLE,
        error_code: CLERK_ERROR_CODE.LOAD_TIMED_OUT,
      },
    );

    expect(unavailable).toEqual({
      status: CLERK_LIFECYCLE_STATUS.UNAVAILABLE,
      error_code: CLERK_ERROR_CODE.LOAD_TIMED_OUT,
    });
    expect(
      transition_clerk_lifecycle(unavailable, {
        type: CLERK_LIFECYCLE_EVENT.INITIALIZATION_STARTED,
      }).status,
    ).toBe(CLERK_LIFECYCLE_STATUS.INITIALIZING);
    expect(
      transition_clerk_lifecycle(unavailable, {
        type: CLERK_LIFECYCLE_EVENT.DESTROYED,
      }),
    ).toBe(INITIAL_CLERK_LIFECYCLE_STATE);
  });
});

describe("clerk store delivery", () => {
  it("publishes immediately while live", () => {
    const step = deliver_clerk_state(
      LIVE_CLERK_STORE_DELIVERY,
      INITIAL_CLERK_STATE,
    );

    expect(step.state_to_publish).toEqual({
      status: "some",
      value: INITIAL_CLERK_STATE,
    });
  });

  it("holds only the latest state during navigation and flushes it after", () => {
    const deferred = change_navigation_state(LIVE_CLERK_STORE_DELIVERY, true);
    const first = deliver_clerk_state(deferred.delivery, INITIAL_CLERK_STATE);
    const second = deliver_clerk_state(
      first.delivery,
      LOADED_SIGNED_OUT_CLERK_STATE,
    );
    const flushed = change_navigation_state(second.delivery, false);

    expect(deferred.delivery.status).toBe(
      CLERK_STORE_DELIVERY_STATUS.DEFERRED_DURING_NAVIGATION,
    );
    expect(second.state_to_publish.status).toBe("none");
    expect(flushed).toEqual({
      delivery: LIVE_CLERK_STORE_DELIVERY,
      state_to_publish: {
        status: "some",
        value: LOADED_SIGNED_OUT_CLERK_STATE,
      },
    });
    expect(
      change_navigation_state(LIVE_CLERK_STORE_DELIVERY, false).state_to_publish
        .status,
    ).toBe("none");
  });
});
