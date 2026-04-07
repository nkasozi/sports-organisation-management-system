import type { Readable } from "svelte/store";

import type { FirstTimeSetupState } from "$lib/presentation/stores/firstTimeSetup";
import type { InitialSyncState } from "$lib/presentation/stores/initialSyncStore";

export interface RootLayoutSubscriptionCommand {
  navigating_store: Readable<unknown | null>;
  page_store: Readable<{ url: { pathname: string } }>;
  first_time_setup_store: Readable<FirstTimeSetupState>;
  clerk_loaded_store: Readable<boolean>;
  initial_sync_store: Readable<InitialSyncState>;
  signed_in_store: Readable<boolean>;
  set_navigating(value: boolean): void;
  on_path_change(pathname: string): void;
  on_setup_change(state: FirstTimeSetupState): void;
  on_clerk_ready_change(value: boolean): void;
  on_sync_change(state: InitialSyncState): void;
  on_signed_in_change(signed_in: boolean): Promise<void>;
}

export function subscribe_root_layout_state(
  command: RootLayoutSubscriptionCommand,
): () => void {
  const unsubscribe_navigating = command.navigating_store.subscribe((nav) => {
    command.set_navigating(nav !== null);
  });
  const unsubscribe_page = command.page_store.subscribe((page_state) => {
    command.on_path_change(page_state.url.pathname);
  });
  const unsubscribe_setup = command.first_time_setup_store.subscribe(
    (state) => {
      command.on_setup_change(state);
    },
  );
  const unsubscribe_clerk = command.clerk_loaded_store.subscribe((loaded) => {
    command.on_clerk_ready_change(loaded);
  });
  const unsubscribe_sync = command.initial_sync_store.subscribe((state) => {
    command.on_sync_change(state);
  });
  const unsubscribe_signed_in = command.signed_in_store.subscribe(
    (signed_in) => {
      void command.on_signed_in_change(signed_in);
    },
  );

  return () => {
    unsubscribe_navigating();
    unsubscribe_page();
    unsubscribe_setup();
    unsubscribe_clerk();
    unsubscribe_sync();
    unsubscribe_signed_in();
  };
}
