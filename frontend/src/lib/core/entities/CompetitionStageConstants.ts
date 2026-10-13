import type { FormatType } from "./CompetitionFormatTypes";
import type { StageType } from "./CompetitionStage";
import { FORMAT_TYPE, STAGE_TYPE } from "./StatusConstants";

export const COMPETITION_STAGE_MESSAGES = {
  COMPETITION_ID_REQUIRED: "Competition ID is required",
  NAME_REQUIRED: "Stage name is required",
  STAGE_ORDER_INVALID: "Stage order must be at least 1",
} as const;

export const LEAGUE_ROUND_NAME_PREFIX = "Round ";

export const STAGE_TYPE_LABELS: Readonly<Record<StageType, string>> = {
  group_stage: "Group Stage",
  knockout_stage: "Knockout Stage",
  league_stage: "League Stage",
  one_off_stage: "One-Off Stage",
  custom: "Custom",
};

type StageBlueprint = { name: string; stage_type: StageType };

type NonLeagueFormatType = Exclude<FormatType, typeof FORMAT_TYPE.LEAGUE>;

const FINAL_STAGE: StageBlueprint = {
  name: "Final",
  stage_type: STAGE_TYPE.ONE_OFF_STAGE,
};

const POOL_STAGE: StageBlueprint = {
  name: "Pool Stage",
  stage_type: STAGE_TYPE.GROUP_STAGE,
};

function knockout(name: string): StageBlueprint {
  return { name, stage_type: STAGE_TYPE.KNOCKOUT_STAGE };
}

export const DEFAULT_STAGE_BLUEPRINTS: Readonly<
  Record<NonLeagueFormatType, ReadonlyArray<StageBlueprint>>
> = {
  [FORMAT_TYPE.ROUND_ROBIN]: [
    { name: "Round Robin", stage_type: STAGE_TYPE.LEAGUE_STAGE },
  ],
  [FORMAT_TYPE.GROUPS_KNOCKOUT]: [
    POOL_STAGE,
    knockout("Semi Finals"),
    FINAL_STAGE,
  ],
  [FORMAT_TYPE.STRAIGHT_KNOCKOUT]: [
    knockout("Round of 16"),
    knockout("Quarter Finals"),
    knockout("Semi Finals"),
    FINAL_STAGE,
  ],
  [FORMAT_TYPE.GROUPS_PLAYOFFS]: [
    POOL_STAGE,
    knockout("Playoffs"),
    FINAL_STAGE,
  ],
  [FORMAT_TYPE.DOUBLE_ELIMINATION]: [
    knockout("Winners Bracket"),
    knockout("Losers Bracket"),
    { name: "Grand Final", stage_type: STAGE_TYPE.ONE_OFF_STAGE },
  ],
  [FORMAT_TYPE.SWISS]: [
    { name: "Swiss Rounds", stage_type: STAGE_TYPE.LEAGUE_STAGE },
    FINAL_STAGE,
  ],
  [FORMAT_TYPE.CUSTOM]: [{ name: "Stage 1", stage_type: STAGE_TYPE.CUSTOM }],
};
