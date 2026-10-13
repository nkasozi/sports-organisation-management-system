import type { Result } from "$lib/core/types/Result";

import {
  OFFICIAL_RATING_PANEL_EVENT,
  OFFICIAL_RATING_PANEL_MESSAGE,
} from "./officialRatingPanelMessages";
import { TOAST_KIND } from "./toastConfig";

interface OfficialRatingSubmitFeedback {
  toast_type: typeof TOAST_KIND.SUCCESS | typeof TOAST_KIND.ERROR;
  toast_message: string;
}

interface OfficialRatingSubmitContext {
  fixture_id: string;
  official_id: string;
  official_name: string;
}

export function resolve_official_rating_submit_feedback(
  result: Result<unknown>,
  context: OfficialRatingSubmitContext,
): OfficialRatingSubmitFeedback {
  if (result.success)
    return {
      toast_type: TOAST_KIND.SUCCESS,
      toast_message: `${OFFICIAL_RATING_PANEL_MESSAGE.SUBMIT_SUCCEEDED_PREFIX} ${context.official_name}`,
    };
  console.error("[OfficialRatingPanel] Rating submit failed", {
    event: OFFICIAL_RATING_PANEL_EVENT.SUBMIT_FAILED,
    fixture_id: context.fixture_id,
    official_id: context.official_id,
    error: result.error,
  });
  return {
    toast_type: TOAST_KIND.ERROR,
    toast_message: OFFICIAL_RATING_PANEL_MESSAGE.SUBMIT_FAILED,
  };
}
