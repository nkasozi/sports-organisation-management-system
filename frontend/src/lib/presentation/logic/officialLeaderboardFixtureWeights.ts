import type { CompetitionStage } from "$lib/core/entities/CompetitionStage";
import type { Fixture } from "$lib/core/entities/Fixture";
import { STAGE_TYPE } from "$lib/core/entities/StatusConstants";
import {
  compute_importance_weight,
  type ImportanceWeightInput,
} from "$lib/core/services/compute_importance_weight";

import { is_number_value } from "./runtimeTypeGuards";

const IMPORTANCE_OVERRIDE_STATUS = {
  AUTOMATIC: "automatic",
  MANUAL: "manual",
} as const satisfies Record<
  string,
  ImportanceWeightInput["manual_override"]["status"]
>;

function build_manual_importance_override(
  manual_importance_override: unknown,
): ImportanceWeightInput["manual_override"] {
  return is_number_value(manual_importance_override)
    ? {
        status: IMPORTANCE_OVERRIDE_STATUS.MANUAL,
        value: manual_importance_override,
      }
    : { status: IMPORTANCE_OVERRIDE_STATUS.AUTOMATIC };
}

export function build_fixture_weight_map(
  fixtures: Fixture[],
  stages: CompetitionStage[],
): Map<string, number> {
  const stage_by_id = new Map(stages.map((s) => [s.id, s]));
  const weight_map = new Map<string, number>();

  for (const fixture of fixtures) {
    const stage = fixture.stage_id ? stage_by_id.get(fixture.stage_id) : void 0;

    const weight_input: ImportanceWeightInput = {
      stage_type: stage?.stage_type ?? STAGE_TYPE.CUSTOM,
      match_day: fixture.match_day ?? 1,
      total_match_days: 0,
      manual_override: build_manual_importance_override(
        fixture.manual_importance_override,
      ),
    };

    weight_map.set(fixture.id, compute_importance_weight(weight_input));
  }

  return weight_map;
}
