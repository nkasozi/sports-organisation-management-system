import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PlayerTeamTransferHistoryRepository } from "../interfaces/ports";
import { create_player_team_transfer_history_use_cases } from "./PlayerTeamTransferHistoryUseCases";
import {
  create_mock_membership_repository,
  create_mock_transfer_repository,
  create_test_transfer,
  create_valid_transfer_input,
} from "./PlayerTeamTransferHistoryUseCases.test_support";

vi.mock("$lib/infrastructure/events/EventBus", () => ({
  EventBus: { emit_entity_updated: vi.fn(), emit_entity_created: vi.fn() },
}));

describe("transfer status changes only through confirm and reject", () => {
  let transfers: PlayerTeamTransferHistoryRepository;
  let use_cases: ReturnType<
    typeof create_player_team_transfer_history_use_cases
  >;

  beforeEach(() => {
    transfers = create_mock_transfer_repository();
    use_cases = create_player_team_transfer_history_use_cases(
      transfers,
      create_mock_membership_repository(),
    );
    vi.mocked(transfers.create).mockImplementation(async (input) => ({
      success: true,
      data: create_test_transfer(input as never),
    }));
    vi.mocked(transfers.update).mockImplementation(async (_id, updates) => ({
      success: true,
      data: create_test_transfer(updates as never),
    }));
  });

  function stored(status: string): void {
    vi.mocked(transfers.find_by_id).mockResolvedValue({
      success: true,
      data: create_test_transfer({ status: status as never }),
    });
  }

  it.each(["approved", "declined"])(
    "refuses to create a transfer that is already %s",
    async (status) => {
      const result = await use_cases.create(
        create_valid_transfer_input({ status: status as never }),
      );
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error).toContain("pending");
      expect(transfers.create).not.toHaveBeenCalled();
    },
  );

  it("creates a pending transfer", async () => {
    const result = await use_cases.create(create_valid_transfer_input());
    expect(result.success).toBe(true);
  });

  it("refuses to change the status through a plain update", async () => {
    stored("pending");
    const result = await use_cases.update("transfer-123", {
      status: "approved",
    });
    expect(result.success).toBe(false);
    expect(transfers.update).not.toHaveBeenCalled();
  });

  it("allows saving notes on a pending transfer with the same status", async () => {
    stored("pending");
    const result = await use_cases.update("transfer-123", {
      status: "pending",
      notes: "Agreed fee",
    });
    expect(result.success).toBe(true);
  });

  it.each(["player_id", "from_team_id", "to_team_id"])(
    "refuses to change %s on a resolved transfer",
    async (field_name) => {
      stored("approved");
      const result = await use_cases.update("transfer-123", {
        [field_name]: "something-else",
      });
      expect(result.success).toBe(false);
      expect(transfers.update).not.toHaveBeenCalled();
    },
  );

  it("allows notes on a resolved transfer when the parties are unchanged", async () => {
    stored("declined");
    const result = await use_cases.update("transfer-123", {
      player_id: "player-123",
      notes: "Paperwork missing",
    });
    expect(result.success).toBe(true);
  });
});
