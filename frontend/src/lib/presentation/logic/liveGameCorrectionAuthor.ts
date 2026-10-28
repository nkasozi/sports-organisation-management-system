import { read_max_event_edits_per_game } from "$lib/core/entities/CompetitionEventEditLimit";
import {
  type CorrectionAuthor,
  EDIT_ALLOWANCE,
} from "$lib/core/entities/FixtureEventCorrections";

import { LIVE_GAME_ACTOR } from "./liveGameControl";
import type { LiveGameDetailPageState } from "./liveGameDetailPageState";

const TABLE_OFFICIAL_LABEL = "Table Official";

type CorrectionAuthorSource = Pick<
  LiveGameDetailPageState,
  | "live_game_actor"
  | "correction_author_name"
  | "correction_author_role"
  | "competition"
>;

export function build_live_game_correction_author(
  page_state: CorrectionAuthorSource,
): CorrectionAuthor {
  if (page_state.live_game_actor === LIVE_GAME_ACTOR.MANAGER)
    return {
      name: page_state.correction_author_name,
      role_label: page_state.correction_author_role,
      allowance: { status: EDIT_ALLOWANCE.UNLIMITED },
    };
  return {
    name: page_state.correction_author_name,
    role_label: TABLE_OFFICIAL_LABEL,
    allowance: {
      status: EDIT_ALLOWANCE.LIMITED,
      max_edits: read_max_event_edits_per_game(page_state.competition ?? {}),
    },
  };
}
