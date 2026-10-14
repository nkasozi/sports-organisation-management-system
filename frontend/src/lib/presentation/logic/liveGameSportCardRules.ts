import type { Competition } from "$lib/core/entities/Competition";
import type { Sport } from "$lib/core/entities/Sport";
import { create_default_card_types } from "$lib/core/entities/SportDefaults";

import {
  build_card_severity_rules,
  type CardSeverityRules,
} from "./liveGamePlayerAvailability";

export function resolve_card_severity_rules(
  sport: Sport | undefined,
  competition: Competition | undefined,
): CardSeverityRules {
  return build_card_severity_rules([
    ...(sport?.card_types ?? create_default_card_types()),
    ...(competition?.rule_overrides?.additional_card_types ?? []),
  ]);
}
