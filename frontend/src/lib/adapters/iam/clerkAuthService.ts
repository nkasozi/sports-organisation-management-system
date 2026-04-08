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
  type ClerkSessionState,
  type ClerkUser,
  INITIAL_CLERK_STATE,
} from "./clerkAuthTypes";
export type { ClerkSessionState, ClerkUser } from "./clerkAuthTypes";

const clerk_store = writable<ClerkSessionState>(INITIAL_CLERK_STATE);

let clerk_instance: Clerk | null = null;
let is_reloading = false;
let is_navigating = false;
let pending_state: ClerkSessionState | null = null;

export function set_navigating(navigating: boolean): void {
  is_navigating = navigating;
  if (!navigating && pending_state) {
    clerk_store.set(pending_state);
    pending_state = null;
  }
}

function safe_store_update(new_state: ClerkSessionState): void {
  if (is_reloading) return;
  if (is_navigating) {
    pending_state = new_state;
    return;
  }
  clerk_store.set(new_state);
}

function build_clerk_state_from_instance(): ClerkSessionState | null {
  if (!clerk_instance || is_reloading) return null;

  const clerkUser = clerk_instance.user;
  const session = clerk_instance.session;

  const user: ClerkUser | null = clerkUser
    ? {
        id: clerkUser.id,
        email_address: clerkUser.emailAddresses?.[0]?.emailAddress ?? "",
        full_name: clerkUser.fullName ?? "",
        first_name: clerkUser.firstName ?? "",
        last_name: clerkUser.lastName ?? "",
        image_url: clerkUser.imageUrl,
      }
    : null;

  return {
    is_loaded: true,
    is_signed_in: !!session,
    user,
    session_id: session?.id ?? null,
  };
}

function sync_clerk_state(): void {
  const new_state = build_clerk_state_from_instance();
  if (!new_state) return;
  requestAnimationFrame(() => {
    safe_store_update(new_state);
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
  if (clerk_instance) {
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
    clerk_instance = window.Clerk as unknown as Clerk;
    const new_state = build_clerk_state_from_instance();
    if (new_state) clerk_store.set(new_state);
    clerk_instance.addListener(() => {
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

export function get_clerk(): Clerk | null {
  return clerk_instance;
}

export async function get_session_token(): Promise<string | null> {
  if (!clerk_instance?.session) {
    console.log("[Clerk] get_session_token: No session available");
    return null;
  }
  try {
    const token = await clerk_instance.session.getToken({ template: "convex" });
    if (!token) {
      console.log("[Clerk] get_session_token: Token returned null");
    }
    return token;
  } catch (error) {
    console.error("[Clerk] Failed to get session token", {
      event: "failed_to_get_session_token_failed",
      error: String(error),
    });
    return null;
  }
}

export async function sign_out(): Promise<Result<true>> {
  if (!clerk_instance) {
    console.error("[Clerk] Not initialized");
    return create_failure_result("Clerk not initialized");
  }
  await clerk_instance.signOut();
  sync_clerk_state();
  return create_success_result(true);
}

export function destroy_clerk(): void {
  clerk_instance = null;
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
