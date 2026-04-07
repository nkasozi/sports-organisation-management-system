import type { Result } from "$lib/core/types/Result";
import { create_success_result } from "$lib/core/types/Result";

import type { AuthStorePort } from "./layoutLoginSync";

interface AnonymousInitialSyncStorePort {
  start_sync(): void;
  update_progress(message: string, percentage: number): void;
  complete_sync(): Promise<void>;
}

interface FirstTimeAnonymousSessionDependencies {
  initial_sync_store: AnonymousInitialSyncStorePort;
  auth_store: AuthStorePort;
  reset_all_data(
    progress_callback: (message: string, percentage: number) => void,
  ): Promise<unknown>;
}

export async function handle_first_time_anonymous_user_session(
  dependencies: FirstTimeAnonymousSessionDependencies,
): Promise<Result<boolean>> {
  dependencies.initial_sync_store.start_sync();
  dependencies.initial_sync_store.update_progress(
    "Loading offline data...",
    20,
  );
  await dependencies.reset_all_data((message: string, percentage: number) =>
    dependencies.initial_sync_store.update_progress(message, percentage),
  );
  dependencies.initial_sync_store.update_progress(
    "Setting up your profile...",
    85,
  );
  dependencies.auth_store.reset_initialized_state();
  await dependencies.auth_store.initialize();
  await dependencies.initial_sync_store.complete_sync();
  console.log("[Layout] First-time anonymous user setup complete", {
    event: "anonymous_first_time_setup_complete",
  });
  return create_success_result(true);
}

export async function handle_returning_anonymous_user_session(
  dependencies: Pick<{ auth_store: AuthStorePort }, "auth_store">,
): Promise<Result<boolean>> {
  dependencies.auth_store.reset_initialized_state();
  await dependencies.auth_store.initialize();
  console.log("[Layout] Returning anonymous user session restored", {
    event: "anonymous_returning_session_restored",
  });
  return create_success_result(true);
}

export async function handle_verified_user_page_reload_session(
  dependencies: Pick<
    {
      auth_store: AuthStorePort;
      start_background_sync(): void;
      trigger_full_sync_on_page_reload(): void | Promise<void>;
    },
    "auth_store" | "start_background_sync" | "trigger_full_sync_on_page_reload"
  >,
): Promise<Result<boolean>> {
  dependencies.auth_store.reset_initialized_state();
  await dependencies.auth_store.initialize();
  dependencies.start_background_sync();
  void dependencies.trigger_full_sync_on_page_reload();
  console.log("[Layout] Verified user page reload — session restored", {
    event: "verified_user_page_reload_complete",
  });
  return create_success_result(true);
}
