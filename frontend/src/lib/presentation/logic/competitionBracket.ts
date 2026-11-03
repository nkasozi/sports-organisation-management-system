import type { CompetitionStage } from "$lib/core/entities/CompetitionStage";
import type { Fixture } from "$lib/core/entities/Fixture";
import { STAGE_TYPE } from "$lib/core/entities/StatusConstants";

import {
  type BracketMatch,
  build_bracket_match,
} from "./competitionBracketMatch";
import {
  type BracketCard,
  type BracketCardContent,
  build_pair_key,
  plan_placeholders,
} from "./competitionBracketPlaceholders";
import { PRESENCE_STATUS } from "./presenceStatus";

export {
  BRACKET_OUTCOME_STATUS,
  type BracketTeamLine,
} from "./competitionBracketMatch";
export type { BracketCard } from "./competitionBracketPlaceholders";

export interface BracketColumn {
  stage: CompetitionStage;
  cards: BracketCard[];
}

export interface BracketLink {
  from_card_id: string;
  to_card_id: string;
}

export interface BracketLayout {
  columns: BracketColumn[];
  links: BracketLink[];
  row_count: number;
}

interface BuildCompetitionBracketCommand {
  stages: CompetitionStage[];
  fixtures: Fixture[];
  show_placeholders: boolean;
}

interface PlacementRequest {
  card_id: string;
  desired_row: number;
  content: BracketCardContent;
}

export function is_bracket_stage_type(stage_type: string): boolean {
  return (
    stage_type === STAGE_TYPE.KNOCKOUT_STAGE ||
    stage_type === STAGE_TYPE.ONE_OFF_STAGE
  );
}

function shares_a_team(card: BracketCard, match: BracketMatch): boolean {
  if (card.content.status !== PRESENCE_STATUS.PRESENT) return false;
  const card_team_ids = [
    card.content.match.home.team_id,
    card.content.match.away.team_id,
  ].filter((team_id: string) => team_id.length > 0);
  return [match.home.team_id, match.away.team_id].some((team_id: string) =>
    card_team_ids.includes(team_id),
  );
}

function average_row(cards: readonly BracketCard[]): number {
  return cards.length === 0
    ? Number.POSITIVE_INFINITY
    : cards.reduce((total, card) => total + card.row, 0) / cards.length;
}

function assign_rows(requests: PlacementRequest[]): BracketCard[] {
  const placed: BracketCard[] = [];
  for (const request of [...requests].sort(
    (left, right) => left.desired_row - right.desired_row,
  )) {
    const next_free_row =
      placed.length === 0 ? 0 : placed[placed.length - 1].row + 1;
    const row = Number.isFinite(request.desired_row)
      ? Math.max(request.desired_row, next_free_row)
      : next_free_row;
    placed.push({ card_id: request.card_id, row, content: request.content });
  }
  return placed;
}

function lay_out_column(
  stage: CompetitionStage,
  matches: BracketMatch[],
  previous_cards: readonly BracketCard[],
  links: BracketLink[],
  show_placeholders: boolean,
): BracketCard[] {
  const linked_card_ids = new Set<string>();
  const match_requests = matches.map((match: BracketMatch) => {
    const feeders = previous_cards.filter((card) => shares_a_team(card, match));
    feeders.forEach((card) => {
      linked_card_ids.add(card.card_id);
      links.push({ from_card_id: card.card_id, to_card_id: match.fixture_id });
    });
    return {
      card_id: match.fixture_id,
      desired_row: previous_cards.length === 0 ? 0 : average_row(feeders),
      content: { status: PRESENCE_STATUS.PRESENT, match } as const,
    };
  });
  if (!show_placeholders) return assign_rows(match_requests);
  const placeholder_requests = plan_placeholders(
    previous_cards,
    linked_card_ids,
    new Set(matches.map(build_pair_key)).size,
    stage.id,
  ).map((placeholder) => {
    placeholder.feeder_card_ids.forEach((card_id: string) =>
      links.push({ from_card_id: card_id, to_card_id: placeholder.card_id }),
    );
    return {
      card_id: placeholder.card_id,
      desired_row: placeholder.desired_row,
      content: { status: PRESENCE_STATUS.MISSING } as const,
    };
  });
  return assign_rows([...match_requests, ...placeholder_requests]);
}

function compare_kickoffs(left: BracketMatch, right: BracketMatch): number {
  return (
    left.kickoff.localeCompare(right.kickoff) ||
    left.fixture_id.localeCompare(right.fixture_id)
  );
}

function order_matches_by_tie(matches: BracketMatch[]): BracketMatch[] {
  const first_leg_by_pair = new Map<string, BracketMatch>();
  for (const match of [...matches].sort(compare_kickoffs)) {
    const pair_key = build_pair_key(match);
    if (!first_leg_by_pair.has(pair_key))
      first_leg_by_pair.set(pair_key, match);
  }
  return [...matches].sort(
    (left, right) =>
      compare_kickoffs(
        first_leg_by_pair.get(build_pair_key(left)) ?? left,
        first_leg_by_pair.get(build_pair_key(right)) ?? right,
      ) || compare_kickoffs(left, right),
  );
}

export function build_competition_bracket(
  command: BuildCompetitionBracketCommand,
): BracketLayout {
  const bracket_stages = command.stages
    .filter((stage) => is_bracket_stage_type(stage.stage_type))
    .sort((left, right) => left.stage_order - right.stage_order);
  const links: BracketLink[] = [];
  const columns: BracketColumn[] = [];
  for (const stage of bracket_stages) {
    const matches = order_matches_by_tie(
      command.fixtures
        .filter((fixture: Fixture) => fixture.stage_id === stage.id)
        .map(build_bracket_match),
    );
    const previous_cards = columns.at(-1)?.cards ?? [];
    columns.push({
      stage,
      cards: lay_out_column(
        stage,
        matches,
        previous_cards,
        links,
        command.show_placeholders,
      ),
    });
  }
  const rows = columns.flatMap((column) =>
    column.cards.map((card) => card.row),
  );
  return {
    columns,
    links,
    row_count: rows.length === 0 ? 0 : Math.max(...rows) + 1,
  };
}
