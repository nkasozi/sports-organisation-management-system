import type { Competition } from "./Competition";
import type { Sport } from "./Sport";
import {
  create_default_card_types,
  create_default_scoring_rules,
} from "./SportDefaults";
import type { SportEventCatalogSource } from "./SportEventCatalog";

const UNKNOWN_SPORT_CODE = "";

export function resolve_sport_event_source(
  sport: Sport | undefined,
  competition: Competition | undefined,
): SportEventCatalogSource {
  const overrides = competition?.rule_overrides;
  const sport_cards = sport?.card_types ?? create_default_card_types();
  return {
    sport_code: sport?.code ?? UNKNOWN_SPORT_CODE,
    scoring_rules:
      overrides?.scoring_rules ??
      sport?.scoring_rules ??
      create_default_scoring_rules(),
    card_types: [...sport_cards, ...(overrides?.additional_card_types ?? [])],
  };
}
