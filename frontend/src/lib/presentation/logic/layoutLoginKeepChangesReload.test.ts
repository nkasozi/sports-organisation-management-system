import { describe, expect, it, vi } from "vitest";

import { ACTIVE_CLERK_IDENTITY_STATUS } from "$lib/presentation/stores/activeClerkIdentity";
import { has_identity_completed_session_sync } from "$lib/presentation/stores/sessionSyncIdentity";
import {
  SESSION_SYNC_STATE_STATUS,
  type SessionSyncState,
} from "$lib/presentation/stores/sessionSyncMarker";

import { determine_session_action, SESSION_ACTION } from "./layoutLogic";
import { sync_verified_user_login_session } from "./layoutLoginSync";
import { create_login_sync_test_dependencies } from "./layoutLoginSync.test_support";

vi.mock("$lib/infrastructure/container", () => ({
  get_app_settings_storage: vi.fn(),
}));

function create_marker_storage(initial_state: SessionSyncState): {
  state: SessionSyncState;
} {
  return { state: initial_state };
}

describe("keep local changes, sign out, then reload", () => {
  it("restores the kept data as a returning anonymous session instead of wiping it", async () => {
    const marker_storage = create_marker_storage({
      status: SESSION_SYNC_STATE_STATUS.ANONYMOUS,
    });
    const { dependencies } = create_login_sync_test_dependencies();
    dependencies.clear_session_sync_flag.mockImplementation(async () => {
      marker_storage.state = { status: SESSION_SYNC_STATE_STATUS.MISSING };
    });
    dependencies.get_unsynced_local_change_count.mockResolvedValue({
      success: true,
      data: 5,
    });
    dependencies.confirm_discard_unsynced_local_changes.mockResolvedValue(
      false,
    );

    const sync_verified_user_login_session_result =
      await sync_verified_user_login_session(dependencies as never);
    expect(sync_verified_user_login_session_result.success).toBe(false);

    const session_already_synced = has_identity_completed_session_sync(
      marker_storage.state,
      { status: ACTIVE_CLERK_IDENTITY_STATUS.SIGNED_OUT },
    );
    expect(determine_session_action(false, session_already_synced)).toBe(
      SESSION_ACTION.RETURNING_ANONYMOUS,
    );
    expect(dependencies.reset_database).not.toHaveBeenCalled();
  });
});
