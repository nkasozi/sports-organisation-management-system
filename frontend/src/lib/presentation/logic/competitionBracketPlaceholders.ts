import type { BracketMatch } from "./competitionBracketMatch";
import { PRESENCE_STATUS } from "./presenceStatus";

const PAIR_KEY_SEPARATOR = "|";
const GAMES_PER_NEXT_ROUND_GAME = 2;

export type BracketCardContent =
  | { status: typeof PRESENCE_STATUS.PRESENT; match: BracketMatch }
  | { status: typeof PRESENCE_STATUS.MISSING };

export interface BracketCard {
  card_id: string;
  row: number;
  content: BracketCardContent;
}

interface PlaceholderRequest {
  card_id: string;
  desired_row: number;
  feeder_card_ids: string[];
}

interface CardGroup {
  card_ids: string[];
  row: number;
}

export function build_pair_key(match: BracketMatch): string {
  return [match.home.team_id, match.away.team_id]
    .sort()
    .join(PAIR_KEY_SEPARATOR);
}

function group_cards_by_pairing(cards: readonly BracketCard[]): CardGroup[] {
  const groups = new Map<string, BracketCard[]>();
  for (const card of cards) {
    const group_key =
      card.content.status === PRESENCE_STATUS.PRESENT
        ? build_pair_key(card.content.match)
        : card.card_id;
    groups.set(group_key, [...(groups.get(group_key) ?? []), card]);
  }
  return [...groups.values()].map((group_cards: BracketCard[]) => ({
    card_ids: group_cards.map((card: BracketCard) => card.card_id),
    row:
      group_cards.reduce((total, card) => total + card.row, 0) /
      group_cards.length,
  }));
}

export function plan_placeholders(
  previous_cards: readonly BracketCard[],
  linked_card_ids: ReadonlySet<string>,
  known_pair_count: number,
  stage_id: string,
): PlaceholderRequest[] {
  const groups = group_cards_by_pairing(previous_cards);
  const expected_pair_count = Math.ceil(
    groups.length / GAMES_PER_NEXT_ROUND_GAME,
  );
  const missing_count = Math.max(0, expected_pair_count - known_pair_count);
  const unlinked_groups = groups
    .filter((group: CardGroup) =>
      group.card_ids.every((card_id: string) => !linked_card_ids.has(card_id)),
    )
    .sort((left: CardGroup, right: CardGroup) => left.row - right.row);
  return Array.from({ length: missing_count }, (_, placeholder_index) => {
    const feeding_groups = unlinked_groups.slice(
      placeholder_index * GAMES_PER_NEXT_ROUND_GAME,
      (placeholder_index + 1) * GAMES_PER_NEXT_ROUND_GAME,
    );
    return {
      card_id: `${stage_id}-tbd-${placeholder_index}`,
      desired_row:
        feeding_groups.length === 0
          ? Number.POSITIVE_INFINITY
          : feeding_groups.reduce((total, group) => total + group.row, 0) /
            feeding_groups.length,
      feeder_card_ids: feeding_groups.flatMap(
        (group: CardGroup) => group.card_ids,
      ),
    };
  });
}
