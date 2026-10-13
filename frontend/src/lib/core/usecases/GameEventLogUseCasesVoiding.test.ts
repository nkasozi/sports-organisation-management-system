import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GameEventLogRepository } from "../interfaces/ports";
import {
  create_game_event_log_use_cases,
  type GameEventLogUseCases,
} from "./GameEventLogUseCases";
import {
  create_mock_game_event_log,
  create_mock_repository,
} from "./GameEventLogUseCases.test_support";

describe("GameEventLogUseCases", () => {
  let use_cases: GameEventLogUseCases;
  let mock_repository: GameEventLogRepository;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_game_event_log_use_cases(mock_repository);
  });

  describe("void_event", () => {
    it("should void an event successfully", async () => {
      const existing_event = create_mock_game_event_log({ voided: false });

      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: existing_event,
      });

      const voided_event = { ...existing_event, voided: true };
      vi.mocked(mock_repository.void_event).mockResolvedValue({
        success: true,
        data: voided_event,
      });

      const result = await use_cases.void_event(
        "event-001",
        "Recorded in error",
        "user-001",
      );

      expect(result.success).toBe(true);
      expect(mock_repository.void_event).toHaveBeenCalledWith(
        "event-001",
        "Recorded in error",
        "user-001",
      );
    });

    it("should fail to void an already voided event", async () => {
      const existing_event = create_mock_game_event_log({ voided: true });

      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: existing_event,
      });

      const result = await use_cases.void_event(
        "event-001",
        "Recorded in error",
        "user-001",
      );

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Event is already voided");
    });

    it("should fail without a reason", async () => {
      const result = await use_cases.void_event("event-001", "", "user-001");

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Void reason is required");
    });
  });

  describe("update", () => {
    it("should fail to update a voided event", async () => {
      const existing_event = create_mock_game_event_log({ voided: true });

      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: existing_event,
      });

      const result = await use_cases.update("event-001", { minute: 30 });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Cannot update a voided event");
    });
  });
});
