import type { OvertimeRule } from "$lib/core/entities/SportTypes";
import { SPORT_OVERTIME_TYPE } from "$lib/presentation/components/sport/sportFormSectionConstants";

type OvertimeType = OvertimeRule["overtime_type"];

const OVERTIME_TYPE_LABEL = {
  EXTRA_TIME: "Extra time",
  GOLDEN_GOAL: "Golden goal",
  SILVER_GOAL: "Silver goal",
  PENALTIES: "Penalty shootout",
  REPLAY: "Replay",
  SHOOTOUT: "Shootout",
} as const;

export function get_overtime_type_label(overtime_type: OvertimeType): string {
  switch (overtime_type) {
    case SPORT_OVERTIME_TYPE.EXTRA_TIME:
      return OVERTIME_TYPE_LABEL.EXTRA_TIME;
    case SPORT_OVERTIME_TYPE.GOLDEN_GOAL:
      return OVERTIME_TYPE_LABEL.GOLDEN_GOAL;
    case SPORT_OVERTIME_TYPE.SILVER_GOAL:
      return OVERTIME_TYPE_LABEL.SILVER_GOAL;
    case SPORT_OVERTIME_TYPE.PENALTIES:
      return OVERTIME_TYPE_LABEL.PENALTIES;
    case SPORT_OVERTIME_TYPE.REPLAY:
      return OVERTIME_TYPE_LABEL.REPLAY;
    case SPORT_OVERTIME_TYPE.SHOOTOUT:
      return OVERTIME_TYPE_LABEL.SHOOTOUT;
  }
}
