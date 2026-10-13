import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PlayerTeamMembershipRepository } from "../interfaces/ports";
import { create_player_team_membership_use_cases } from "./PlayerTeamMembershipUseCases";
import {
  create_mock_repository,
  create_test_membership,
  create_valid_input,
} from "./PlayerTeamMembershipUseCases.test_support";

function page_of(items: unknown[]): never {
  return {
    success: true,
    data: {
      items,
      total_count: items.length,
      page_number: 1,
      page_size: 10,
      total_pages: 1,
    },
  } as never;
}

describe("creating memberships keeps one active team per player", () => {
  let repository: PlayerTeamMembershipRepository;

  beforeEach(() => {
    repository = create_mock_repository();
    vi.mocked(repository.create).mockResolvedValue({
      success: true,
      data: create_test_membership(),
    });
  });

  it("refuses a second active membership for the same player", async () => {
    vi.mocked(repository.find_all).mockResolvedValue(
      page_of([create_test_membership({ team_id: "team-other" as never })]),
    );
    const result =
      await create_player_team_membership_use_cases(repository).create(
        create_valid_input(),
      );
    expect(result.success).toBe(false);
    expect(result.success === false && result.error).toContain(
      "already active",
    );
    expect(repository.find_all).toHaveBeenCalledWith({
      player_id: "player-456",
      status: "active",
    });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("creates the membership when the player has no active team", async () => {
    vi.mocked(repository.find_all).mockResolvedValue(page_of([]));
    const result =
      await create_player_team_membership_use_cases(repository).create(
        create_valid_input(),
      );
    expect(result.success).toBe(true);
  });

  it("allows inactive memberships without checking active teams", async () => {
    const result = await create_player_team_membership_use_cases(
      repository,
    ).create(create_valid_input({ status: "inactive" } as never));
    expect(result.success).toBe(true);
    expect(repository.find_all).not.toHaveBeenCalled();
  });

  it("fails when active memberships cannot be checked", async () => {
    vi.mocked(repository.find_all).mockResolvedValue({
      success: false,
      error: "offline",
    } as never);
    const result =
      await create_player_team_membership_use_cases(repository).create(
        create_valid_input(),
      );
    expect(result.success).toBe(false);
    expect(repository.create).not.toHaveBeenCalled();
  });
});
