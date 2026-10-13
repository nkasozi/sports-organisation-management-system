import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PlayerTeamMembershipUseCases } from "../../core/usecases/PlayerTeamMembershipUseCases";
import { apply_player_transfer_membership_change } from "./playerTransferApprovalLogic";
import {
  create_mock_use_cases,
  create_new_membership_entity,
  create_test_transfer,
  make_paginated_response,
} from "./playerTransferApprovalLogic.test_support";

describe("apply_player_transfer_membership_change without old membership", () => {
  let mock_use_cases: PlayerTeamMembershipUseCases;

  beforeEach(() => {
    mock_use_cases = create_mock_use_cases();
  });

  it("succeeds even when player has no existing membership for from_team", async () => {
    vi.mocked(mock_use_cases.list_memberships_by_player).mockResolvedValue(
      make_paginated_response([]),
    );
    vi.mocked(mock_use_cases.create).mockResolvedValue({
      success: true,
      data: create_new_membership_entity("m-new", "team-B"),
    });

    const result = await apply_player_transfer_membership_change(
      mock_use_cases,
      create_test_transfer(),
    );

    expect(result.success).toBe(true);
    expect(mock_use_cases.delete_memberships).not.toHaveBeenCalled();
    expect(mock_use_cases.create).toHaveBeenCalled();
  });
});
