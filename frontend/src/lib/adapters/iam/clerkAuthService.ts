import { browser } from "$app/environment";
import { PUBLIC_CLERK_PUBLISHABLE_KEY } from "$env/static/public";
import { writable, derived, type Readable } from "svelte/store";

export interface ClerkUser {
  id: string;
  email_address: string;
  full_name: string;
  first_name: string;
  last_name: string;
  image_url?: string;
}

export interface ClerkSessionState {
  is_loaded: boolean;
  is_signed_in: boolean;
  user: ClerkUser | null;
  session_id: string | null;
}

const initial_state: ClerkSessionState = {
  is_loaded: false,
  is_signed_in: false,
  user: null,
  session_id: null,
};

const clerk_store = writable<ClerkSessionState>(initial_state);

let get_token_fn: (() => Promise<string | null>) | null = null;

export function set_clerk_token_getter(fn: () => Promise<string | null>): void {
  get_token_fn = fn;
}

export function update_clerk_session_state(
  is_signed_in: boolean,
  user_id: string | null,
  user_email: string | null,
): void {
  const user: ClerkUser | null = user_id
    ? {
        id: user_id,
        email_address: user_email ?? "",
        full_name: "",
        first_name: "",
        last_name: "",
      }
    : null;

  clerk_store.set({
    is_loaded: true,
    is_signed_in,
    user,
    session_id: null,
  });
}

export async function initialize_clerk(): Promise<boolean> {
  if (!browser) return false;

  const publishable_key = PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishable_key) {
    console.log(
      "[Clerk] No PUBLIC_CLERK_PUBLISHABLE_KEY configured, skipping Clerk initialization",
    );
    return false;
  }

  console.log(
    "[Clerk] Clerk will be initialized via svelte-clerk ClerkProvider",
  );
  return true;
}

export async function get_session_token(): Promise<string | null> {
  if (!get_token_fn) {
    console.warn(
      "[Clerk] Token getter not set. Make sure ClerkProvider is mounted.",
    );
    return null;
  }

  try {
    return await get_token_fn();
  } catch (error) {
    console.error("[Clerk] Failed to get session token:", error);
    return null;
  }
}

export function destroy_clerk(): void {
  get_token_fn = null;
  clerk_store.set(initial_state);
}

export const clerk_session: Readable<ClerkSessionState> = {
  subscribe: clerk_store.subscribe,
};

export const clerk_user: Readable<ClerkUser | null> = derived(
  clerk_store,
  ($state) => $state.user,
);

export const is_clerk_loaded: Readable<boolean> = derived(
  clerk_store,
  ($state) => $state.is_loaded,
);

export const is_signed_in: Readable<boolean> = derived(
  clerk_store,
  ($state) => $state.is_signed_in,
);
