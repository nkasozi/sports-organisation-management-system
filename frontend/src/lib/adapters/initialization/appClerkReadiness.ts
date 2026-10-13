import { get } from "svelte/store";

import { is_clerk_loaded } from "$lib/adapters/iam/clerkAuthService";

const CLERK_SETTLE_WAIT_STARTED_EVENT = "clerk_settle_wait_started";

export async function wait_for_clerk_to_settle(): Promise<boolean> {
  if (get(is_clerk_loaded)) return true;
  console.log("[AppInitializer] Waiting for Clerk to settle", {
    event: CLERK_SETTLE_WAIT_STARTED_EVENT,
  });
  return new Promise<boolean>((resolve) => {
    const unsubscribe = is_clerk_loaded.subscribe((loaded) => {
      if (!loaded) return;
      unsubscribe();
      resolve(true);
    });
  });
}
