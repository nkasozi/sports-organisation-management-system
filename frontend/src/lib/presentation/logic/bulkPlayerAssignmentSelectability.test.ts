import { describe, expect, it } from "vitest";

import { PlayerTeamMembershipUseCaseMessage } from "$lib/core/usecases/PlayerTeamMembershipUseCasesConstants";

import {
  build_player_assignments,
  count_selected_players,
  get_selected_player_assignments,
} from "./bulkPlayerAssignmentPageState";
import {
  create_test_membership,
  create_test_player,
  create_test_team,
} from "./bulkPlayerAssignmentPageState.test_support";
import {
  BULK_PLAYER_ASSIGNMENT_BLOCKED_GUIDANCE,
  is_player_assignment_selectable,
} from "./bulkPlayerAssignmentSelectability";

function build_one_free_and_one_active_player(): ReturnType<
  typeof build_player_assignments
> {
  return build_player_assignments(
    [
      create_test_player({ id: "player_free" }),
      create_test_player({ id: "player_active" }),
    ],
    [create_test_membership({ player_id: "player_active", team_id: "team_2" })],
    [create_test_team({ id: "team_2", name: "Red Lions" })],
    "2026-10-24",
  );
}

describe("bulk assignment selectability", () => {
  it("lets players without an active team be selected", () => {
    const [free_player] = build_one_free_and_one_active_player();
    expect(is_player_assignment_selectable(free_player)).toBe(true);
  });

  it("does not let players already active on another team be selected", () => {
    const [, active_player] = build_one_free_and_one_active_player();
    expect(is_player_assignment_selectable(active_player)).toBe(false);
  });

  it("uses the same guidance as the single membership form", () => {
    expect(BULK_PLAYER_ASSIGNMENT_BLOCKED_GUIDANCE).toBe(
      PlayerTeamMembershipUseCaseMessage.ALREADY_ACTIVE_ELSEWHERE,
    );
  });

  it("never counts or saves a player already active on another team", () => {
    const [free_player, active_player] = build_one_free_and_one_active_player();
    free_player.selected = true;
    active_player.selected = true;
    expect(count_selected_players([free_player], [active_player])).toBe(1);
    expect(
      get_selected_player_assignments([free_player], [active_player]),
    ).toEqual([free_player]);
  });
});
