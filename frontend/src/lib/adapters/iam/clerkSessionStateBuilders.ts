import type { Clerk } from "@clerk/clerk-js";

import {
  CLERK_PRESENCE_STATUS,
  type ClerkSessionIdentifierState,
  type ClerkSessionState,
  type ClerkUserState,
} from "./clerkAuthTypes";

const MISSING_EMAIL_ADDRESS = "";

function read_primary_email_address(
  clerk_user: NonNullable<Clerk["user"]>,
): string {
  return clerk_user.primaryEmailAddress?.emailAddress ?? MISSING_EMAIL_ADDRESS;
}

function build_clerk_user_state(clerk_user: Clerk["user"]): ClerkUserState {
  if (!clerk_user) {
    return { status: CLERK_PRESENCE_STATUS.MISSING };
  }

  return {
    status: CLERK_PRESENCE_STATUS.PRESENT,
    user: {
      id: clerk_user.id,
      email_address: read_primary_email_address(clerk_user),
      full_name: clerk_user.fullName ?? "",
      first_name: clerk_user.firstName ?? "",
      last_name: clerk_user.lastName ?? "",
      image_url: clerk_user.imageUrl,
    },
  };
}

function build_clerk_session_identifier_state(
  clerk_session: Clerk["session"],
): ClerkSessionIdentifierState {
  if (!clerk_session?.id) {
    return { status: CLERK_PRESENCE_STATUS.MISSING };
  }

  return {
    status: CLERK_PRESENCE_STATUS.PRESENT,
    session_id: clerk_session.id,
  };
}

export function build_clerk_session_state(clerk: Clerk): ClerkSessionState {
  return {
    is_loaded: true,
    is_signed_in: !!clerk.session,
    user_state: build_clerk_user_state(clerk.user),
    session_id_state: build_clerk_session_identifier_state(clerk.session),
  };
}
