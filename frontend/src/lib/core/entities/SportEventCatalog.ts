import type { QuickEventButton } from "./FixtureGameEventConfig";
import { GAME_EVENT_ICONS, GAME_EVENT_LABELS } from "./FixtureGameEventConfig";
import {
  CARD_BUTTON_COLOR,
  CARD_BUTTON_COLORS,
  CARD_BUTTON_ICON,
  COMMON_MATCH_EVENT_BUTTONS,
  LEGACY_SCORE_POINTS,
  NO_SCORE_AWARD,
  OPPOSING_SIDE_SCORE_EVENTS,
  SCORE_AWARD_KIND,
  SCORE_BUTTON_COLOR,
  SCORE_BUTTON_ICON,
  SCORE_CREDITED_SIDE,
  type ScoreAward,
  SINGLE_POINT,
  SPORT_EXTRA_EVENT_BUTTONS,
} from "./SportEventCatalogConstants";

export {
  NO_SCORE_AWARD,
  SCORE_AWARD_KIND,
  SCORE_CREDITED_SIDE,
  type ScoreAward,
} from "./SportEventCatalogConstants";

export type ScoreAwardResolver = (event_type: string) => ScoreAward;

export interface ScoringRuleSource {
  event_type: string;
  points_awarded: number;
}

export interface CardTypeSource {
  id: string;
  name: string;
}

export interface SportEventCatalogSource {
  sport_code: string;
  scoring_rules: readonly ScoringRuleSource[];
  card_types: readonly CardTypeSource[];
}

export function create_credit_award(
  event_type: string,
  points: number,
): ScoreAward {
  return {
    kind: SCORE_AWARD_KIND.CREDIT,
    credited_side: OPPOSING_SIDE_SCORE_EVENTS.has(event_type)
      ? SCORE_CREDITED_SIDE.OPPOSING
      : SCORE_CREDITED_SIDE.ACTING,
    points,
  };
}

function resolve_legacy_award(event_type: string): ScoreAward {
  const legacy_points = LEGACY_SCORE_POINTS.get(event_type);
  return legacy_points === void 0
    ? NO_SCORE_AWARD
    : create_credit_award(event_type, legacy_points);
}

export function create_score_award_resolver(
  scoring_rules: readonly ScoringRuleSource[],
): ScoreAwardResolver {
  const points_by_event = new Map(
    scoring_rules.map((rule) => [rule.event_type, rule.points_awarded]),
  );
  return (event_type: string): ScoreAward => {
    if (points_by_event.size === 0) return resolve_legacy_award(event_type);
    const points = points_by_event.get(event_type);
    return points === void 0
      ? NO_SCORE_AWARD
      : create_credit_award(event_type, points);
  };
}

export function humanize_event_code(event_code: string): string {
  return event_code
    .split("_")
    .filter((word) => word.length > 0)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

export function get_known_event_label(event_code: string): string {
  return (
    (GAME_EVENT_LABELS as Readonly<Record<string, string>>)[event_code] ??
    humanize_event_code(event_code)
  );
}

function get_known_event_icon(event_code: string, fallback: string): string {
  return (
    (GAME_EVENT_ICONS as Readonly<Record<string, string>>)[event_code] ??
    fallback
  );
}

function build_scoring_button(rule: ScoringRuleSource): QuickEventButton {
  const base_label = get_known_event_label(rule.event_type);
  return {
    id: rule.event_type,
    label:
      rule.points_awarded === SINGLE_POINT
        ? base_label
        : `${base_label} (+${rule.points_awarded})`,
    icon: get_known_event_icon(rule.event_type, SCORE_BUTTON_ICON),
    color: SCORE_BUTTON_COLOR,
    affects_score: true,
    requires_player: true,
    score_award: create_credit_award(rule.event_type, rule.points_awarded),
  };
}

function build_card_button(card: CardTypeSource): QuickEventButton {
  return {
    id: card.id,
    label: card.name,
    icon: get_known_event_icon(card.id, CARD_BUTTON_ICON),
    color: CARD_BUTTON_COLORS[card.id] ?? CARD_BUTTON_COLOR,
    affects_score: false,
    requires_player: true,
    score_award: NO_SCORE_AWARD,
  };
}

export function normalize_sport_code(sport_code: string): string {
  return sport_code
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

export function build_sport_event_buttons(
  source: SportEventCatalogSource,
): QuickEventButton[] {
  const extra_buttons =
    SPORT_EXTRA_EVENT_BUTTONS[normalize_sport_code(source.sport_code)] ?? [];
  const match_buttons = [...COMMON_MATCH_EVENT_BUTTONS, ...extra_buttons].map(
    (button) => ({ ...button, score_award: NO_SCORE_AWARD }),
  );
  return [
    ...source.scoring_rules.map(build_scoring_button),
    ...source.card_types.map(build_card_button),
    ...match_buttons,
  ];
}
