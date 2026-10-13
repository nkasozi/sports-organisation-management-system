import { beforeEach, describe, expect, it, vi } from "vitest";

import type { UpdateTeamInput } from "../entities/Team";
import type { TeamRepository } from "../interfaces/ports";
import { create_team_use_cases } from "./TeamUseCases";
import {
  create_mock_repository,
  create_mock_team,
} from "./TeamUseCases.test_support";

describe("TeamUseCases", () => {
  let mock_repository: TeamRepository;
  let use_cases: ReturnType<typeof create_team_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_team_use_cases(mock_repository);
  });

  describe("update", () => {
    it("updates team with valid input", async () => {
      const update_input = { name: "Updated Team Name" } as UpdateTeamInput;
      const updated_team = create_mock_team({
        id: "t1",
        name: "Updated Team Name",
      });
      vi.mocked(mock_repository.update).mockResolvedValue({
        success: true,
        data: updated_team,
      });

      const result = await use_cases.update("t1", update_input);

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data?.name).toBe("Updated Team Name");
      expect(mock_repository.update).toHaveBeenCalledWith("t1", update_input);
    });

    it("returns error when id is empty", async () => {
      const result = await use_cases.update("", { name: "New Name" });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Team ID is required");
      expect(mock_repository.update).not.toHaveBeenCalled();
    });

    it("returns error when id is whitespace only", async () => {
      const result = await use_cases.update("   ", { name: "New Name" });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Team ID is required");
    });
  });

  describe("delete", () => {
    it("deletes team successfully", async () => {
      vi.mocked(mock_repository.delete_by_id).mockResolvedValue({
        success: true,
        data: true,
      });

      const result = await use_cases.delete("t1");

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data).toBe(true);
      expect(mock_repository.delete_by_id).toHaveBeenCalledWith("t1");
    });

    it("returns error when id is empty", async () => {
      const result = await use_cases.delete("");

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Team ID is required");
      expect(mock_repository.delete_by_id).not.toHaveBeenCalled();
    });

    it("returns error when id is whitespace only", async () => {
      const result = await use_cases.delete("   ");

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Team ID is required");
    });
  });

  describe("delete_teams", () => {
    it("deletes multiple teams successfully", async () => {
      vi.mocked(mock_repository.delete_by_ids).mockResolvedValue({
        success: true,
        data: 3,
      });

      const result = await use_cases.delete_teams(["t1", "t2", "t3"]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(3);
      }
      expect(mock_repository.delete_by_ids).toHaveBeenCalledWith([
        "t1",
        "t2",
        "t3",
      ]);
    });

    it("returns error when ids array is empty", async () => {
      const result = await use_cases.delete_teams([]);

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("At least one team ID is required");
      expect(mock_repository.delete_by_ids).not.toHaveBeenCalled();
    });
  });
});
