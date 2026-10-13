import { STAGE_TYPE } from "$lib/core/entities/StatusConstants";

export const COMPETITION_STATS_ALL_TEAMS_FILTER = "all";

export const STANDING_FORM_RESULT = {
  WIN: "W",
  DRAW: "D",
  LOSS: "L",
} as const;

const STANDING_FORM_CLASSES: Readonly<Record<string, string>> = {
  [STANDING_FORM_RESULT.WIN]: "bg-green-500 text-white",
  [STANDING_FORM_RESULT.DRAW]: "bg-gray-400 text-white",
};

const STANDING_FORM_LOSS_CLASSES = "bg-red-500 text-white";
const STANDING_FORM_LOSS_SYMBOL = "✕";

export function get_standing_form_classes(form_result: string): string {
  return STANDING_FORM_CLASSES[form_result] ?? STANDING_FORM_LOSS_CLASSES;
}

export function get_standing_form_label(form_result: string): string {
  return form_result === STANDING_FORM_RESULT.LOSS
    ? STANDING_FORM_LOSS_SYMBOL
    : form_result;
}
export const MATCH_REPORT_PATH_PREFIX = "/match-report/";

export function is_bracket_stage_type(stage_type: string): boolean {
  return (
    stage_type === STAGE_TYPE.KNOCKOUT_STAGE ||
    stage_type === STAGE_TYPE.ONE_OFF_STAGE
  );
}

export const COMPETITION_RESULTS_DOWNLOAD_TEXT = {
  REPORT_DOWNLOADED: "Match report downloaded.",
  REPORT_FAILED:
    "We couldn't download the match report. Please try again in a moment.",
  ALL_REPORTS_DOWNLOADED: "Match reports downloaded.",
  ALL_REPORTS_FAILED:
    "We couldn't download the match reports. Please try again in a moment.",
} as const;
