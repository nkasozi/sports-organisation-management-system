export const PUBLIC_PLAYER_LINK_ITEMS = [
  { id: "1", platform: "website", url: "https://club.test" },
  {
    id: "2",
    platform: "youtube",
    url: "https://youtube.test/watch",
  },
  {
    id: "3",
    platform: "twitter",
    url: "https://x.test/jane",
  },
];

export const EMPTY_PUBLIC_PLAYER_STATS = {
  total_matches: 0,
  goals: 0,
  own_goals: 0,
  assists: 0,
  yellow_cards: 0,
  red_cards: 0,
  substitutions_in: 0,
  substitutions_out: 0,
};

export const SINGLE_FIXTURE_PUBLIC_PLAYER_STATS = {
  total_matches: 1,
  goals: 1,
  own_goals: 0,
  assists: 0,
  yellow_cards: 1,
  red_cards: 0,
  substitutions_in: 0,
  substitutions_out: 0,
};

export function build_public_player_membership(): Record<string, string> {
  return {
    id: "membership-1",
    player_id: "player-1",
    team_id: "team-1",
  };
}

export const PUBLIC_PLAYER_COMPLETED_FIXTURE = {
  id: "fixture-1",
  status: "completed",
  home_team_id: "team-1",
  away_team_id: "team-2",
  game_events: [
    {
      event_type: "goal",
      player_name: "Jane Doe",
      secondary_player_name: "Alex Roe",
    },
    {
      event_type: "yellow_card",
      player_name: "Jane Doe",
      secondary_player_name: "",
    },
  ],
};
