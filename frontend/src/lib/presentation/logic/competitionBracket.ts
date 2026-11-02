import type { CompetitionStage } from "$lib/core/entities/CompetitionStage";
import type { Fixture } from "$lib/core/entities/Fixture";
import { STAGE_TYPE } from "$lib/core/entities/StatusConstants";

import {
  type BracketTie,
  group_fixtures_into_ties,
} from "./competitionBracketTies";
import { PRESENCE_STATUS } from "./presenceStatus";

export {
  BRACKET_OUTCOME_STATUS,
  type BracketTeamLine,
  type BracketTie,
} from "./competitionBracketTies";

export type BracketSlot =
  | { status: typeof PRESENCE_STATUS.PRESENT; tie: BracketTie }
  | { status: typeof PRESENCE_STATUS.MISSING };

export interface BracketRound {
  stage: CompetitionStage;
  slots: BracketSlot[];
}

interface BuildCompetitionBracketCommand {
  stages: CompetitionStage[];
  fixtures: Fixture[];
}

const MISSING_SLOT: BracketSlot = { status: PRESENCE_STATUS.MISSING };

export function is_bracket_stage_type(stage_type: string): boolean {
  return (
    stage_type === STAGE_TYPE.KNOCKOUT_STAGE ||
    stage_type === STAGE_TYPE.ONE_OFF_STAGE
  );
}

function tie_team_ids(tie: BracketTie): string[] {
  return [tie.first_team.team_id, tie.second_team.team_id];
}

function find_feeding_slot_index(
  tie: BracketTie,
  previous_slots: BracketSlot[],
): number {
  const team_ids = tie_team_ids(tie);
  return previous_slots.findIndex(
    (slot: BracketSlot) =>
      slot.status === PRESENCE_STATUS.PRESENT &&
      tie_team_ids(slot.tie).some((team_id: string) =>
        team_ids.includes(team_id),
      ),
  );
}

function place_ties_in_slots(
  ties: BracketTie[],
  previous_slots: BracketSlot[],
): BracketSlot[] {
  const slot_count = Math.max(
    Math.ceil(previous_slots.length / 2),
    ties.length,
  );
  const slots: BracketSlot[] = Array.from(
    { length: slot_count },
    () => MISSING_SLOT,
  );
  const unplaced_ties: BracketTie[] = [];
  for (const tie of ties) {
    const feeding_index = find_feeding_slot_index(tie, previous_slots);
    const target_index = Math.floor(feeding_index / 2);
    const can_place =
      feeding_index >= 0 &&
      slots[target_index].status === PRESENCE_STATUS.MISSING;
    if (can_place)
      slots[target_index] = { status: PRESENCE_STATUS.PRESENT, tie };
    if (!can_place) unplaced_ties.push(tie);
  }
  for (const tie of unplaced_ties) {
    const free_index = slots.findIndex(
      (slot: BracketSlot) => slot.status === PRESENCE_STATUS.MISSING,
    );
    slots[free_index] = { status: PRESENCE_STATUS.PRESENT, tie };
  }
  return slots;
}

export function build_competition_bracket(
  command: BuildCompetitionBracketCommand,
): BracketRound[] {
  const bracket_stages = command.stages
    .filter((stage: CompetitionStage) =>
      is_bracket_stage_type(stage.stage_type),
    )
    .sort(
      (left: CompetitionStage, right: CompetitionStage) =>
        left.stage_order - right.stage_order,
    );
  const rounds: BracketRound[] = [];
  for (const stage of bracket_stages) {
    const stage_ties = group_fixtures_into_ties(
      command.fixtures.filter(
        (fixture: Fixture) => fixture.stage_id === stage.id,
      ),
    );
    const previous_slots =
      rounds.length > 0 ? rounds[rounds.length - 1].slots : [];
    rounds.push({
      stage,
      slots: place_ties_in_slots(stage_ties, previous_slots),
    });
  }
  return rounds;
}
