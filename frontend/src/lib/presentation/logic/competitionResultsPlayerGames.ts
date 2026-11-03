import type {
  PlayerStatMoment,
  PlayerStatMomentKind,
} from "./competitionResultsPlayerMoments";

interface PlayerStatGame {
  fixture_id: string;
  kickoff: string;
  opponent_team_id: string;
  moments: PlayerStatMoment[];
}

export function group_player_moments_by_game(
  moments: readonly PlayerStatMoment[],
  kind: PlayerStatMomentKind,
): PlayerStatGame[] {
  const games = new Map<string, PlayerStatGame>();
  for (const moment of moments) {
    if (moment.kind !== kind) continue;
    const game = games.get(moment.fixture_id) ?? {
      fixture_id: moment.fixture_id,
      kickoff: moment.kickoff,
      opponent_team_id: moment.opponent_team_id,
      moments: [],
    };
    game.moments.push(moment);
    games.set(moment.fixture_id, game);
  }
  return [...games.values()]
    .map((game: PlayerStatGame) => ({
      ...game,
      moments: [...game.moments].sort(
        (left, right) => left.timing_rank - right.timing_rank,
      ),
    }))
    .sort((left: PlayerStatGame, right: PlayerStatGame) =>
      right.kickoff.localeCompare(left.kickoff),
    );
}
