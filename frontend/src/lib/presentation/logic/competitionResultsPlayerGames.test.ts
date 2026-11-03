import { describe, expect, it } from "vitest";

import { group_player_moments_by_game } from "./competitionResultsPlayerGames";
import {
  PLAYER_STAT_MOMENT_KIND,
  type PlayerStatMoment,
} from "./competitionResultsStats";

function score_moment(
  fixture_id: string,
  kickoff: string,
  minute: number,
): PlayerStatMoment {
  return {
    kind: PLAYER_STAT_MOMENT_KIND.SCORE,
    fixture_id,
    kickoff,
    opponent_team_id: `opponent_of_${fixture_id}`,
    timing_label: `${minute}'`,
    timing_rank: minute,
    points: 1,
  };
}

const card_moment: PlayerStatMoment = {
  kind: PLAYER_STAT_MOMENT_KIND.CARD,
  fixture_id: "april",
  kickoff: "2026-04-25T13:00",
  opponent_team_id: "opponent_of_april",
  timing_label: "30'",
  timing_rank: 30,
  card_type_id: "green_card",
};

describe("group_player_moments_by_game", () => {
  const moments = [
    score_moment("april", "2026-04-25T13:00", 40),
    score_moment("may", "2026-05-02T13:00", 5),
    card_moment,
    score_moment("april", "2026-04-25T13:00", 12),
  ];

  it("groups one kind of moment by game, latest game first and minutes in order", () => {
    expect(
      group_player_moments_by_game(moments, PLAYER_STAT_MOMENT_KIND.SCORE),
    ).toEqual([
      {
        fixture_id: "may",
        kickoff: "2026-05-02T13:00",
        opponent_team_id: "opponent_of_may",
        moments: [moments[1]],
      },
      {
        fixture_id: "april",
        kickoff: "2026-04-25T13:00",
        opponent_team_id: "opponent_of_april",
        moments: [moments[3], moments[0]],
      },
    ]);
  });

  it("only includes the requested kind of moment", () => {
    expect(
      group_player_moments_by_game(moments, PLAYER_STAT_MOMENT_KIND.CARD),
    ).toEqual([
      {
        fixture_id: "april",
        kickoff: "2026-04-25T13:00",
        opponent_team_id: "opponent_of_april",
        moments: [card_moment],
      },
    ]);
  });
});
