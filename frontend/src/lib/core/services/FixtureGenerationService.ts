import type { Team } from "../entities/Team";
import type { CompetitionFormat } from "../entities/CompetitionFormat";
import type { CreateFixtureInput } from "../entities/Fixture";
import { generate_round_robin_fixtures } from "../entities/Fixture";

export interface FixtureGenerationRequest {
  competition_id: string;
  teams: Team[];
  competition_format: CompetitionFormat;
  start_date: string;
  default_time: string;
  venue_rotation: "home_away" | "neutral" | "single_venue";
  single_venue?: string;
}

export function generate_league_fixtures(
  competition_id: string,
  teams: Team[],
  start_date: string,
  default_time: string,
  venue_rotation: "home_away" | "neutral" | "single_venue",
  single_venue: string | undefined,
  rounds: number,
): CreateFixtureInput[] {
  const team_ids = teams.map((t) => t.id);

  return generate_round_robin_fixtures({
    competition_id,
    team_ids,
    start_date,
    match_days_per_week: [0],
    default_time,
    venue_rotation,
    single_venue,
    rounds,
  });
}

export function generate_knockout_fixtures(
  competition_id: string,
  teams: Team[],
  start_date: string,
  default_time: string,
  venue_rotation: "home_away" | "neutral" | "single_venue",
  single_venue: string | undefined,
): CreateFixtureInput[] {
  const fixtures: CreateFixtureInput[] = [];

  if (teams.length === 0) {
    return fixtures;
  }

  const sorted_teams = [...teams].sort((a, b) => a.name.localeCompare(b.name));
  let current_round_teams = sorted_teams;
  let round_number = 1;
  let match_day = 1;
  let current_date = new Date(start_date);

  while (current_round_teams.length > 1) {
    const round_name = get_knockout_round_name(current_round_teams.length);

    for (let i = 0; i < current_round_teams.length; i += 2) {
      if (i + 1 >= current_round_teams.length) break;

      const home_team = current_round_teams[i];
      const away_team = current_round_teams[i + 1];

      const venue =
        venue_rotation === "single_venue" && single_venue ? single_venue : "";

      fixtures.push({
        competition_id,
        round_number,
        round_name,
        home_team_id: home_team.id,
        away_team_id: away_team.id,
        venue,
        scheduled_date: current_date.toISOString().split("T")[0],
        scheduled_time: default_time,
        assigned_officials: [],
        match_day,
        notes: "",
        status: "scheduled",
      });

      match_day++;
    }

    current_date.setDate(current_date.getDate() + 7);
    round_number++;
    current_round_teams = current_round_teams.slice(
      0,
      Math.ceil(current_round_teams.length / 2),
    );
  }

  return fixtures;
}

export function generate_group_stage_fixtures(
  competition_id: string,
  teams: Team[],
  start_date: string,
  default_time: string,
  venue_rotation: "home_away" | "neutral" | "single_venue",
  single_venue: string | undefined,
  teams_per_group: number,
): CreateFixtureInput[] {
  const fixtures: CreateFixtureInput[] = [];

  if (teams.length === 0) {
    return fixtures;
  }

  const num_groups = Math.ceil(teams.length / teams_per_group);
  const groups: Team[][] = [];

  for (let i = 0; i < num_groups; i++) {
    groups.push([]);
  }

  for (let i = 0; i < teams.length; i++) {
    groups[i % num_groups].push(teams[i]);
  }

  let match_day = 1;
  let current_date = new Date(start_date);

  for (let group_idx = 0; group_idx < groups.length; group_idx++) {
    const group = groups[group_idx];
    const group_name = `Group ${String.fromCharCode(65 + group_idx)}`;

    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const home_team = group[i];
        const away_team = group[j];

        const venue =
          venue_rotation === "single_venue" && single_venue ? single_venue : "";

        fixtures.push({
          competition_id,
          round_number: group_idx + 1,
          round_name: group_name,
          home_team_id: home_team.id,
          away_team_id: away_team.id,
          venue,
          scheduled_date: current_date.toISOString().split("T")[0],
          scheduled_time: default_time,
          assigned_officials: [],
          match_day,
          notes: "",
          status: "scheduled",
        });

        match_day++;
        current_date.setDate(current_date.getDate() + 1);
      }
    }

    current_date.setDate(current_date.getDate() + 7);
  }

  return fixtures;
}

export function generate_double_elimination_fixtures(
  competition_id: string,
  teams: Team[],
  start_date: string,
  default_time: string,
  venue_rotation: "home_away" | "neutral" | "single_venue",
  single_venue: string | undefined,
): CreateFixtureInput[] {
  const fixtures: CreateFixtureInput[] = [];

  if (teams.length <= 1) {
    return fixtures;
  }

  const sorted_teams = [...teams].sort((a, b) => a.name.localeCompare(b.name));

  let current_date = new Date(start_date);
  let match_day = 1;
  let round_number = 1;

  let winners_bracket = sorted_teams;
  let losers_bracket: Team[] = [];

  while (winners_bracket.length > 1 || losers_bracket.length > 1) {
    const venue =
      venue_rotation === "single_venue" && single_venue ? single_venue : "";

    if (winners_bracket.length > 1) {
      for (let i = 0; i < winners_bracket.length; i += 2) {
        if (i + 1 >= winners_bracket.length) break;

        const home_team = winners_bracket[i];
        const away_team = winners_bracket[i + 1];

        fixtures.push({
          competition_id,
          round_number,
          round_name: `Winners Round ${round_number}`,
          home_team_id: home_team.id,
          away_team_id: away_team.id,
          venue,
          scheduled_date: current_date.toISOString().split("T")[0],
          scheduled_time: default_time,
          assigned_officials: [],
          match_day,
          notes: "",
          status: "scheduled",
        });

        match_day++;
        losers_bracket.push(away_team);
      }

      winners_bracket = winners_bracket.slice(
        0,
        Math.ceil(winners_bracket.length / 2),
      );
      current_date.setDate(current_date.getDate() + 1);
    }

    if (losers_bracket.length > 1) {
      for (let i = 0; i < losers_bracket.length; i += 2) {
        if (i + 1 >= losers_bracket.length) break;

        const home_team = losers_bracket[i];
        const away_team = losers_bracket[i + 1];

        fixtures.push({
          competition_id,
          round_number,
          round_name: `Losers Round ${round_number}`,
          home_team_id: home_team.id,
          away_team_id: away_team.id,
          venue,
          scheduled_date: current_date.toISOString().split("T")[0],
          scheduled_time: default_time,
          assigned_officials: [],
          match_day,
          notes: "",
          status: "scheduled",
        });

        match_day++;
      }

      losers_bracket = losers_bracket.slice(
        0,
        Math.ceil(losers_bracket.length / 2),
      );
      current_date.setDate(current_date.getDate() + 1);
    }

    round_number++;
  }

  return fixtures;
}

export function generate_swiss_fixtures(
  competition_id: string,
  teams: Team[],
  start_date: string,
  default_time: string,
  venue_rotation: "home_away" | "neutral" | "single_venue",
  single_venue: string | undefined,
  rounds: number,
): CreateFixtureInput[] {
  const fixtures: CreateFixtureInput[] = [];

  if (teams.length < 2) {
    return fixtures;
  }

  const team_ids = teams.map((t) => t.id);
  let current_date = new Date(start_date);
  let match_day = 1;

  for (let round = 1; round <= rounds; round++) {
    const shuffled = shuffle_array([...team_ids]);
    const venue =
      venue_rotation === "single_venue" && single_venue ? single_venue : "";

    for (let i = 0; i < shuffled.length; i += 2) {
      if (i + 1 >= shuffled.length) break;

      fixtures.push({
        competition_id,
        round_number: round,
        round_name: `Round ${round}`,
        home_team_id: shuffled[i],
        away_team_id: shuffled[i + 1],
        venue,
        scheduled_date: current_date.toISOString().split("T")[0],
        scheduled_time: default_time,
        assigned_officials: [],
        match_day,
        notes: "",
        status: "scheduled",
      });

      match_day++;
    }

    current_date.setDate(current_date.getDate() + 7);
  }

  return fixtures;
}

export function generate_custom_fixtures(
  competition_id: string,
  teams: Team[],
  start_date: string,
  default_time: string,
  venue_rotation: "home_away" | "neutral" | "single_venue",
  single_venue: string | undefined,
): CreateFixtureInput[] {
  return [];
}

export function generate_fixtures_from_format(
  request: FixtureGenerationRequest,
): CreateFixtureInput[] {
  const format = request.competition_format;

  switch (format.format_type) {
    case "league":
      const league_config = format.league_config;
      const num_rounds = league_config?.number_of_rounds ?? 1;
      return generate_league_fixtures(
        request.competition_id,
        request.teams,
        request.start_date,
        request.default_time,
        request.venue_rotation,
        request.single_venue,
        num_rounds,
      );

    case "round_robin":
      const rr_config = format.league_config;
      const rr_rounds = rr_config?.number_of_rounds ?? 1;
      return generate_league_fixtures(
        request.competition_id,
        request.teams,
        request.start_date,
        request.default_time,
        request.venue_rotation,
        request.single_venue,
        rr_rounds,
      );

    case "straight_knockout":
      return generate_knockout_fixtures(
        request.competition_id,
        request.teams,
        request.start_date,
        request.default_time,
        request.venue_rotation,
        request.single_venue,
      );

    case "groups_knockout":
      const gk_config = format.group_stage_config;
      const teams_per_group = gk_config?.teams_per_group ?? 4;
      return generate_group_stage_fixtures(
        request.competition_id,
        request.teams,
        request.start_date,
        request.default_time,
        request.venue_rotation,
        request.single_venue,
        teams_per_group,
      );

    case "groups_playoffs":
      const gp_config = format.group_stage_config;
      const gp_teams_per_group = gp_config?.teams_per_group ?? 4;
      const group_fixtures = generate_group_stage_fixtures(
        request.competition_id,
        request.teams,
        request.start_date,
        request.default_time,
        request.venue_rotation,
        request.single_venue,
        gp_teams_per_group,
      );

      const playoff_start = new Date(request.start_date);
      playoff_start.setDate(playoff_start.getDate() + 60);

      const qualified_teams = request.teams.slice(
        0,
        Math.ceil(request.teams.length / 2),
      );
      const playoff_fixtures = generate_knockout_fixtures(
        request.competition_id,
        qualified_teams,
        playoff_start.toISOString().split("T")[0],
        request.default_time,
        request.venue_rotation,
        request.single_venue,
      );

      return [...group_fixtures, ...playoff_fixtures];

    case "double_elimination":
      return generate_double_elimination_fixtures(
        request.competition_id,
        request.teams,
        request.start_date,
        request.default_time,
        request.venue_rotation,
        request.single_venue,
      );

    case "swiss":
      const swiss_config = format.league_config;
      const swiss_rounds = swiss_config?.number_of_rounds ?? 4;
      return generate_swiss_fixtures(
        request.competition_id,
        request.teams,
        request.start_date,
        request.default_time,
        request.venue_rotation,
        request.single_venue,
        swiss_rounds,
      );

    case "custom":
      return generate_custom_fixtures(
        request.competition_id,
        request.teams,
        request.start_date,
        request.default_time,
        request.venue_rotation,
        request.single_venue,
      );

    default:
      return [];
  }
}

function shuffle_array<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function get_knockout_round_name(teams_remaining: number): string {
  if (teams_remaining === 2) return "Final";
  if (teams_remaining === 4) return "Semi-Final";
  if (teams_remaining === 8) return "Quarter-Final";
  return `Round of ${teams_remaining}`;
}
