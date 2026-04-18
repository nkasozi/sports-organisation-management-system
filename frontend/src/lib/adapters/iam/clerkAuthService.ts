import type { Clerk } from "@clerk/clerk-js";
import { derived, type Readable, writable } from "svelte/store";

import { browser } from "$app/environment";
import { PUBLIC_CLERK_PUBLISHABLE_KEY } from "$env/static/public";
import type { Result } from "$lib/core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import {
  type ClerkSessionIdentifierState,
  type ClerkSessionState,
  type ClerkUserState,
  INITIAL_CLERK_STATE,
} from "./clerkAuthTypes";
export type { ClerkUser } from "./clerkAuthTypes";

const clerk_store = writable<ClerkSessionState>(INITIAL_CLERK_STATE);

type ClerkInstanceState =
  | { status: "uninitialized" }
  | { status: "ready"; clerk: Clerk };
type PendingClerkState =
  | { status: "empty" }
  | { status: "ready"; state: ClerkSessionState };
type ClerkStateBuildResult =
  | { status: "built"; state: ClerkSessionState }
  | { status: "skipped" };

let is_reloading = false;
let is_navigating = false;
let clerk_instance_state: ClerkInstanceState = { status: "uninitialized" };
let pending_clerk_state: PendingClerkState = { status: "empty" };

export function set_navigating(navigating: boolean): void {
  is_navigating = navigating;
  if (!navigating && pending_clerk_state.status === "ready") {
    clerk_store.set(pending_clerk_state.state);
    pending_clerk_state = { status: "empty" };
  }
}

function safe_store_update(new_state: ClerkSessionState): void {
  if (is_reloading) return;
  if (is_navigating) {
    pending_clerk_state = { status: "ready", state: new_state };
    return;
  }
  clerk_store.set(new_state);
}

function build_clerk_user_state(clerk_user: Clerk["user"]): ClerkUserState {
  if (!clerk_user) {
    return { status: "missing" };
  }

  return {
    status: "present",
    user: {
      id: clerk_user.id,
      email_address: clerk_user.emailAddresses?.[0]?.emailAddress ?? "",
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
    return { status: "missing" };
  }

  return {
    status: "present",
    session_id: clerk_session.id,
  };
}

function build_clerk_state_from_instance(): ClerkStateBuildResult {
  if (clerk_instance_state.status !== "ready" || is_reloading) {
    return { status: "skipped" };
  }

  const clerkUser = clerk_instance_state.clerk.user;
  const session = clerk_instance_state.clerk.session;

  return {
    status: "built",
    state: {
      is_loaded: true,
      is_signed_in: !!session,
      user_state: build_clerk_user_state(clerkUser),
      session_id_state: build_clerk_session_identifier_state(session),
    },
  };
}

function sync_clerk_state(): void {
  const state_result = build_clerk_state_from_instance();
  if (state_result.status !== "built") return;
  requestAnimationFrame(() => {
    safe_store_update(state_result.state);
  });
}

function mark_clerk_loaded_without_session(): void {
  requestAnimationFrame(() => {
    safe_store_update({ ...INITIAL_CLERK_STATE, is_loaded: true });
  });
}

export async function initialize_clerk(): Promise<boolean> {
  if (!browser) return false;
  const publishable_key = PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!publishable_key) {
    console.log("[Clerk] No PUBLIC_CLERK_PUBLISHABLE_KEY configured, skipping");
    mark_clerk_loaded_without_session();
    return false;
  }
  if (clerk_instance_state.status === "ready") {
    console.log("[Clerk] Already initialized");
    return true;
  }
  try {
    const max_wait_ms = 10000;
    const poll_interval_ms = 100;
    let elapsed_ms = 0;

    while (!window.Clerk && elapsed_ms < max_wait_ms) {
      await new Promise((resolve) => setTimeout(resolve, poll_interval_ms));
      elapsed_ms += poll_interval_ms;
    }

    if (!window.Clerk) {
      console.error("[Clerk] ClerkProvider did not load Clerk in time");
      mark_clerk_loaded_without_session();
      return false;
    }
    const clerk = window.Clerk as unknown as Clerk & { loaded?: boolean };
    while (!clerk.loaded && elapsed_ms < max_wait_ms) {
      await new Promise((resolve) => setTimeout(resolve, poll_interval_ms));
      elapsed_ms += poll_interval_ms;
    }
    if (!clerk.loaded) {
      console.warn(
        "[Clerk] Clerk did not finish loading in time, proceeding anyway",
      );
    }
    if (clerk.user && !clerk.session) {
      console.log(
        "[Clerk] User exists but session not ready, waiting for session...",
      );
      while (!clerk.session && elapsed_ms < max_wait_ms) {
        await new Promise((resolve) => setTimeout(resolve, poll_interval_ms));
        elapsed_ms += poll_interval_ms;
      }
      if (!clerk.session) {
        console.warn("[Clerk] Session did not become available in time");
      } else {
        console.log("[Clerk] Session now available");
      }
    }
    clerk_instance_state = { status: "ready", clerk: clerk as Clerk };
    const state_result = build_clerk_state_from_instance();
    if (state_result.status === "built") {
      clerk_store.set(state_result.state);
    }
    clerk.addListener(() => {
      sync_clerk_state();
    });
    console.log("[Clerk] Initialized successfully via ClerkProvider");
    return true;
  } catch (error) {
    console.error("[Clerk] Failed to initialize", {
      event: "failed_to_initialize_failed",
      error: String(error),
    });
    mark_clerk_loaded_without_session();
    return false;
  }
}

export function get_clerk(): Result<Clerk> {
  if (clerk_instance_state.status !== "ready") {
    return create_failure_result("Clerk not initialized");
  }

  return create_success_result(clerk_instance_state.clerk);
}

export async function get_session_token(): Promise<Result<string>> {
  const clerk_result = get_clerk();

  if (!clerk_result.success || !clerk_result.data.session) {
    console.log("[Clerk] get_session_token: No session available");
    return create_failure_result("No Clerk session available");
  }
  try {
    const token = await clerk_result.data.session.getToken({
      template: "convex",
    });
    if (!token) {
      console.log("[Clerk] get_session_token: Token returned null");
      return create_failure_result("Clerk session token unavailable");
    }

    return create_success_result(token);
  } catch (error) {
    console.error("[Clerk] Failed to get session token", {
      event: "failed_to_get_session_token_failed",
      error: String(error),
    });
    return create_failure_result("Failed to get Clerk session token");
  }
}

export async function sign_out(): Promise<Result<true>> {
  if (clerk_instance_state.status !== "ready") {
    console.error("[Clerk] Not initialized");
    return create_failure_result("Clerk not initialized");
  }
  await clerk_instance_state.clerk.signOut();
  sync_clerk_state();
  return create_success_result(true);
}

export function destroy_clerk(): void {
  clerk_instance_state = { status: "uninitialized" };
  clerk_store.set(INITIAL_CLERK_STATE);
}
export const clerk_session: Readable<ClerkSessionState> = {
  subscribe: clerk_store.subscribe,
};
export const is_clerk_loaded: Readable<boolean> = derived(
  clerk_store,
  ($state) => $state.is_loaded,
);
export const is_signed_in: Readable<boolean> = derived(
  clerk_store,
  ($state) => $state.is_signed_in,
);
