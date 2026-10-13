import type { CreateOfficialPerformanceRatingInput } from "$lib/core/entities/OfficialPerformanceRating";
import type { OfficialRatingState } from "$lib/presentation/logic/officialRatingPanelState";

export const OFFICIAL_RATING_PANEL_STATUS = {
  LOADING: "loading",
  FAILED: "failed",
  READY: "ready",
} as const;

export type OfficialRatingPanelViewState =
  | { status: typeof OFFICIAL_RATING_PANEL_STATUS.LOADING }
  | { status: typeof OFFICIAL_RATING_PANEL_STATUS.FAILED; message: string }
  | { status: typeof OFFICIAL_RATING_PANEL_STATUS.READY };

interface OfficialRatingSubmitContext {
  organization_id: string;
  fixture_id: string;
  rater_user_id: string;
  rater_role: string;
}

export function build_official_rating_submit_input(
  state: OfficialRatingState,
  context: OfficialRatingSubmitContext,
): CreateOfficialPerformanceRatingInput {
  return {
    ...context,
    official_id: state.official.id,
    overall: state.rating.overall,
    decision_accuracy: state.rating.decision_accuracy,
    game_control: state.rating.game_control,
    communication: state.rating.communication,
    fitness: state.rating.fitness,
    notes: state.rating.notes,
    submitted_at: new Date().toISOString(),
  };
}
