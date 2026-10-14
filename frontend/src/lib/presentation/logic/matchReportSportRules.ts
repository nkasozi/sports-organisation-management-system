import type { Competition } from "$lib/core/entities/Competition";
import type { Sport, SportGamePeriod } from "$lib/core/entities/Sport";
import { create_default_card_types } from "$lib/core/entities/SportDefaults";
import type { SportEventCatalogSource } from "$lib/core/entities/SportEventCatalog";
import { resolve_sport_event_source } from "$lib/core/entities/SportEventSource";
import type { CardTypeConfig } from "$lib/core/types/MatchReportTypes";

import {
  build_fair_play_card_weights,
  type FairPlayCardWeights,
} from "./competitionStandingsFairPlay";
import { get_effective_periods_for } from "./liveGameDetailPeriodState";

export interface MatchReportSportRules {
  event_source: SportEventCatalogSource;
  periods: SportGamePeriod[];
  card_types: CardTypeConfig[];
  fair_play_card_weights: FairPlayCardWeights;
}

function build_report_card_types(sport: Sport | undefined): CardTypeConfig[] {
  return (sport?.card_types ?? create_default_card_types()).map((card) => ({
    id: card.id,
    name: card.name,
    color: card.color,
    event_type: card.id,
  }));
}

export function build_match_report_sport_rules(
  sport: Sport | undefined,
  competition: Competition | undefined,
): MatchReportSportRules {
  return {
    event_source: resolve_sport_event_source(sport, competition),
    periods: get_effective_periods_for(sport, competition),
    card_types: build_report_card_types(sport),
    fair_play_card_weights: build_fair_play_card_weights([
      ...(sport?.card_types ?? create_default_card_types()),
      ...(competition?.rule_overrides?.additional_card_types ?? []),
    ]),
  };
}
