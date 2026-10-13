import { describe, expect, it } from "vitest";

import {
  CLERK_PRESENCE_STATUS,
  type ClerkSessionState,
  LOADED_SIGNED_OUT_CLERK_STATE,
} from "$lib/adapters/iam/clerkAuthTypes";
import { CLERK_REACHABILITY_STATUS } from "$lib/adapters/iam/clerkReachability";

import {
  classify_device_session,
  DEVICE_SESSION_STATUS,
} from "./deviceSessionState";
import {
  resolve_session_identity,
  SESSION_IDENTITY_STATUS,
} from "./sessionIdentityResolution";
import { SESSION_SYNC_STATE_STATUS } from "./sessionSyncMarker";

const CONFIRMED = { status: CLERK_REACHABILITY_STATUS.CONFIRMED } as const;
const UNREACHABLE = { status: CLERK_REACHABILITY_STATUS.UNREACHABLE } as const;

const SIGNED_IN_CLERK_STATE: ClerkSessionState = {
  is_loaded: true,
  is_signed_in: true,
  user_state: {
    status: CLERK_PRESENCE_STATUS.PRESENT,
    user: {
      id: "user_1",
      email_address: "ann@example.test",
      full_name: "Ann Lee",
      first_name: "Ann",
      last_name: "Lee",
    },
  },
  session_id_state: {
    status: CLERK_PRESENCE_STATUS.PRESENT,
    session_id: "sess_1",
  },
};

const VERIFIED_USER_SYNC = {
  status: SESSION_SYNC_STATE_STATUS.VERIFIED_USER,
  session_id: "sess_old",
  user_id: "user_1",
} as const;
const VERIFIED_SESSION_SYNC = {
  status: SESSION_SYNC_STATE_STATUS.VERIFIED_SESSION,
  session_id: "sess_old",
} as const;
const ANONYMOUS_SYNC = { status: SESSION_SYNC_STATE_STATUS.ANONYMOUS } as const;

describe("resolve_session_identity", () => {
  it("trusts a Clerk session whether or not Clerk is reachable", () => {
    expect(
      resolve_session_identity(UNREACHABLE, SIGNED_IN_CLERK_STATE),
    ).toEqual({
      status: SESSION_IDENTITY_STATUS.SIGNED_IN,
      identity: {
        status: "signed_in",
        session_id: "sess_1",
        user_id: "user_1",
      },
    });
  });

  it("only reports a confirmed sign-out when Clerk answered", () => {
    expect(
      resolve_session_identity(CONFIRMED, LOADED_SIGNED_OUT_CLERK_STATE),
    ).toEqual({ status: SESSION_IDENTITY_STATUS.CONFIRMED_SIGNED_OUT });
  });

  it("reports an unreachable identity when Clerk could not answer", () => {
    expect(
      resolve_session_identity(UNREACHABLE, LOADED_SIGNED_OUT_CLERK_STATE),
    ).toEqual({ status: SESSION_IDENTITY_STATUS.UNREACHABLE });
  });
});

describe("classify_device_session", () => {
  const signed_in = resolve_session_identity(CONFIRMED, SIGNED_IN_CLERK_STATE);
  const confirmed_signed_out = {
    status: SESSION_IDENTITY_STATUS.CONFIRMED_SIGNED_OUT,
  } as const;
  const unreachable = { status: SESSION_IDENTITY_STATUS.UNREACHABLE } as const;

  it("keeps a signed-in identity signed in", () => {
    expect(classify_device_session(signed_in, VERIFIED_USER_SYNC).status).toBe(
      DEVICE_SESSION_STATUS.SIGNED_IN,
    );
  });

  it.each([VERIFIED_USER_SYNC, VERIFIED_SESSION_SYNC])(
    "continues offline as the last verified user when Clerk is unreachable",
    (verified_sync) => {
      expect(classify_device_session(unreachable, verified_sync)).toEqual({
        status: DEVICE_SESSION_STATUS.OFFLINE_VERIFIED,
        verified_sync,
      });
    },
  );

  it("marks the session ended only when Clerk confirmed the sign-out", () => {
    expect(
      classify_device_session(confirmed_signed_out, VERIFIED_USER_SYNC),
    ).toEqual({
      status: DEVICE_SESSION_STATUS.SESSION_ENDED,
      verified_sync: VERIFIED_USER_SYNC,
    });
  });

  it.each([
    ANONYMOUS_SYNC,
    { status: SESSION_SYNC_STATE_STATUS.MISSING },
    { status: SESSION_SYNC_STATE_STATUS.LEGACY },
  ] as const)(
    "treats a device without verified data as anonymous",
    (session_sync_state) => {
      expect(
        classify_device_session(confirmed_signed_out, session_sync_state),
      ).toEqual({ status: DEVICE_SESSION_STATUS.ANONYMOUS });
      expect(classify_device_session(unreachable, session_sync_state)).toEqual({
        status: DEVICE_SESSION_STATUS.ANONYMOUS,
      });
    },
  );
});
