import type { PointsConfig } from "$lib/core/entities/CompetitionFormatTypes";

import type { CompetitionCreateSelectedSportState } from "./competitionCreatePageFlow";
import { PRESENCE_STATUS } from "./presenceStatus";

const SPORT_CODE = { BASKETBALL: "BASKETBALL" } as const;

const BASKETBALL_POINTS: PointsConfig = {
  points_for_win: 2,
  points_for_draw: 0,
  points_for_loss: 1,
};

interface SportRuleOverrides {
  points_config_override?: PointsConfig;
}

function points_for_sport_code(code: string): SportRuleOverrides {
  switch (code.toUpperCase()) {
    case SPORT_CODE.BASKETBALL:
      return { points_config_override: { ...BASKETBALL_POINTS } };
    default:
      return {};
  }
}

export function build_sport_rule_overrides(
  sport_state: CompetitionCreateSelectedSportState,
): SportRuleOverrides {
  switch (sport_state.status) {
    case PRESENCE_STATUS.PRESENT:
      return points_for_sport_code(String(sport_state.sport.code ?? ""));
    case PRESENCE_STATUS.MISSING:
      return {};
  }
}
