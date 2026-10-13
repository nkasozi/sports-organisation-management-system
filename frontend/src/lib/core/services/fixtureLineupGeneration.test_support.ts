import { expect, type Mock, vi } from "vitest";

import type { LineupGenerationResult } from "./fixtureLineupCandidates";

export interface LineupGenerationTestDependencies {
  membership: { list: Mock };
  player: { get_by_id: Mock };
  position: { list: Mock };
  lineup: { create: Mock };
}

type SuccessfulLineupGeneration = Extract<
  LineupGenerationResult,
  { success: true }
>;

type FailedLineupGeneration = Extract<
  LineupGenerationResult,
  { success: false }
>;

export function expect_lineup_failure(
  result: LineupGenerationResult,
): FailedLineupGeneration {
  expect(result.success).toBe(false);
  if (result.success) {
    expect.unreachable(result.generation_message);
  }
  return result;
}

export const NO_PREVIOUS_LINEUP = {
  success: true,
  data: { status: "none" },
} as const;

export function expect_lineup_success(
  result: LineupGenerationResult,
): SuccessfulLineupGeneration {
  expect(result.success).toBe(true);
  if (!result.success) {
    expect.unreachable(result.error_message);
  }
  return result;
}

export const FIXTURE = {
  id: "fx1",
  organization_id: "org1",
  competition_id: "c1",
};
const PLAYERS = [
  { id: "p1", first_name: "Zed", last_name: "Brown", position_id: "pos1" },
  { id: "p2", first_name: "Amy", last_name: "Adams", position_id: "pos2" },
  { id: "p3", first_name: "Bea", last_name: "Adams", position_id: "" },
  { id: "p4", first_name: "Gone", last_name: "Inactive", position_id: "" },
];
const MEMBERSHIPS = PLAYERS.map((player, index) => ({
  player_id: player.id,
  jersey_number: index + 1,
  status: player.id === "p4" ? "inactive" : "active",
}));

export function create_dependencies(
  create_result: unknown = { success: true },
): LineupGenerationTestDependencies {
  return {
    membership: {
      list: vi
        .fn()
        .mockResolvedValue({ success: true, data: { items: MEMBERSHIPS } }),
    },
    player: {
      get_by_id: vi.fn((id: string) => {
        const player = PLAYERS.find((item) => item.id === id);
        return Promise.resolve(
          player
            ? { success: true, data: player }
            : { success: false, error: "missing" },
        );
      }),
    },
    position: {
      list: vi.fn().mockResolvedValue({
        success: true,
        data: {
          items: [
            { id: "pos1", name: "Forward" },
            { id: "pos2", name: "Keeper" },
          ],
        },
      }),
    },
    lineup: { create: vi.fn().mockResolvedValue(create_result) },
  };
}
