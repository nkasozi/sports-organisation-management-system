import type { Result } from "$lib/core/types/Result";
import type { InitialSyncState } from "$lib/presentation/stores/initialSyncStore";

import type { LayoutLoginSyncDependencies } from "./layoutLoginSync";

type LoginSyncDependenciesWithoutState = Omit<
  LayoutLoginSyncDependencies,
  "initial_sync_store"
>;

interface LayoutLoginSyncDependencyCommand extends LoginSyncDependenciesWithoutState {
  initial_sync_store: {
    start_sync(): void;
    update_progress(message: string, percentage: number): void;
    complete_sync(): Promise<Result<boolean>>;
    reset(): void;
  };
  get_initial_sync_state(): InitialSyncState;
}

export function create_layout_login_sync_dependencies(
  command: LayoutLoginSyncDependencyCommand,
): LayoutLoginSyncDependencies {
  return {
    ...command,
    initial_sync_store: {
      ...command.initial_sync_store,
      get_state: () => command.get_initial_sync_state(),
    },
  };
}
