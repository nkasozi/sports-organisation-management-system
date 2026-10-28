import { read_max_event_edits_per_game } from "$lib/core/entities/CompetitionEventEditLimit";
import { read_event_edits_used } from "$lib/core/entities/FixtureEventCorrections";
import { FIXTURE_STATUS } from "$lib/core/entities/StatusConstants";

import { LIVE_GAME_ACTOR } from "./liveGameControl";
import type { LiveGameDetailPageState } from "./liveGameDetailPageState";

export interface LiveGameCorrectionAccess {
  can_correct: boolean;
  can_reset: boolean;
  status_text: string;
  help_text: string;
  edit_cost_text: string;
}

type CorrectionAccessSource = Pick<
  LiveGameDetailPageState,
  "can_modify_game" | "live_game_actor" | "competition" | "fixture"
>;

const NO_ACCESS: LiveGameCorrectionAccess = {
  can_correct: false,
  can_reset: false,
  status_text: "",
  help_text: "",
  edit_cost_text: "",
};
const ASK_MANAGER_TO_RESET =
  "If you need to fix another event, ask your officials manager to reset this game's edits.";

function official_access(used: number, max: number): LiveGameCorrectionAccess {
  if (max === 0)
    return {
      ...NO_ACCESS,
      status_text: "Editing events is turned off for this competition.",
      help_text:
        "If an event is wrong, ask your officials manager to correct it.",
    };
  const left = Math.max(0, max - used);
  if (left === 0)
    return {
      ...NO_ACCESS,
      status_text: `You've used all ${max} event edits for this game.`,
      help_text: ASK_MANAGER_TO_RESET,
    };
  return {
    ...NO_ACCESS,
    can_correct: true,
    status_text: `${left} of ${max} event edits left for this game`,
    help_text:
      "Each edit or deletion uses one and needs a reason, which is shown in the match log.",
    edit_cost_text: `This uses 1 of your ${left} remaining edits.`,
  };
}

function manager_access(used: number, max: number): LiveGameCorrectionAccess {
  return {
    can_correct: true,
    can_reset: used > 0,
    status_text:
      max === 0
        ? "Officials can't edit events in this competition."
        : `The table official has used ${used} of ${max} event edits in this game.`,
    help_text:
      "Your corrections aren't limited. Each one needs a reason and is shown in the match log.",
    edit_cost_text: "",
  };
}

export function derive_live_game_correction_access(
  page_state: CorrectionAccessSource,
  is_game_active: boolean,
): LiveGameCorrectionAccess {
  const fixture = page_state.fixture;
  if (!fixture || !page_state.can_modify_game) return NO_ACCESS;
  const is_completed = fixture.status === FIXTURE_STATUS.COMPLETED;
  const used = read_event_edits_used(fixture);
  const max = read_max_event_edits_per_game(page_state.competition ?? {});
  switch (page_state.live_game_actor) {
    case LIVE_GAME_ACTOR.MANAGER:
      return is_game_active || is_completed
        ? manager_access(used, max)
        : NO_ACCESS;
    case LIVE_GAME_ACTOR.TABLE_OFFICIAL:
      return is_game_active ? official_access(used, max) : NO_ACCESS;
    case LIVE_GAME_ACTOR.WATCHER:
      return NO_ACCESS;
  }
}
