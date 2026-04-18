import type { Competition } from "$lib/core/entities/Competition";
import type { CompetitionTeam } from "$lib/core/entities/CompetitionTeam";
import type { Fixture } from "$lib/core/entities/Fixture";
import type { Team } from "$lib/core/entities/Team";
import {
  matches_team_player_search,
  type TeamPlayer,
} from "$lib/core/services/teamPlayers";

export type FixtureLineupCreateWizardStep = {
  step_key: "organization" | "fixture" | "team" | "players" | "confirm";
  step_title: string;
  step_description?: string;
  is_completed: boolean;
  is_optional?: boolean;
};

export function build_fixture_lineup_create_wizard_steps(
  has_selected_organization: boolean,
  has_selected_fixture: boolean,
  has_selected_team: boolean,
  selected_player_count: number,
  minimum_players: number,
  maximum_players: number,
  confirm_lock: boolean,
): FixtureLineupCreateWizardStep[] {
  const players_completed =
    selected_player_count >= minimum_players &&
    selected_player_count <= maximum_players;
  return [
    {
      step_key: "organization",
      step_title: "Organization",
      step_description: "Choose the organization",
      is_completed: has_selected_organization,
    },
    {
      step_key: "fixture",
      step_title: "Fixture",
      step_description: "Choose the fixture",
      is_completed: has_selected_fixture,
    },
    {
      step_key: "team",
      step_title: "Team",
      step_description: "Choose home/away competition team",
      is_completed: has_selected_team,
    },
    {
      step_key: "players",
      step_title: "Players",
      step_description: `Select ${minimum_players}-${maximum_players}`,
      is_completed: players_completed,
    },
    {
      step_key: "confirm",
      step_title: "Confirm",
      step_description: "Review + lock",
      is_completed: players_completed && confirm_lock,
    },
  ];
}

export function get_player_role_label(
  player_index: number,
  starters_count: number,
): string {
  return player_index < starters_count ? "Starter" : "Substitute";
}

export function format_fixture_date_time(
  scheduled_date: string,
  scheduled_time: string,
): string {
  if (!scheduled_date.trim()) return "";
  const date = new Date(scheduled_date);
  if (Number.isNaN(date.getTime())) return "";
  const month_names = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const formatted_date = `${date.getDate()} ${month_names[date.getMonth()]} ${date.getFullYear()}`;
  return scheduled_time.trim()
    ? `${formatted_date} - ${scheduled_time}`
    : formatted_date;
}

export function get_fixture_display_name(
  fixture: Fixture,
  teams: Team[],
  competitions: Competition[],
): string {
  const home_team = teams.find((team) => team.id === fixture.home_team_id);
  const away_team = teams.find((team) => team.id === fixture.away_team_id);
  const competition = competitions.find(
    (current_competition) => current_competition.id === fixture.competition_id,
  );
  const parts: string[] = [];
  if (competition?.name) parts.push(competition.name);
  parts.push(
    `${home_team?.name || "Unknown"} vs ${away_team?.name || "Unknown"}`,
  );
  const formatted_date_time = format_fixture_date_time(
    fixture.scheduled_date,
    fixture.scheduled_time,
  );
  if (formatted_date_time) parts.push(formatted_date_time);
  return parts.join(" - ");
}

export function build_fixture_team_label_map(
  fixture_teams: Team[],
  competition_teams: CompetitionTeam[],
): Map<string, string> {
  const competition_team_by_team_id = new Map(
    competition_teams.map((competition_team) => [
      competition_team.team_id,
      competition_team,
    ]),
  );
  return new Map(
    fixture_teams.map((team) => {
      const competition_team =
        competition_team_by_team_id.get(team.id) || undefined;
      const seed = competition_team?.seed_number
        ? ` • Seed ${competition_team.seed_number}`
        : "";
      const status = competition_team?.status
        ? ` • ${competition_team.status}`
        : " • not registered";
      return [team.id, `${team.name}${seed}${status}`];
    }),
  );
}

export function build_filtered_team_players(
  players: TeamPlayer[],
  search_text: string,
): TeamPlayer[] {
  const search = search_text.trim();
  if (!search) return players;
  return players.filter((player) => matches_team_player_search(player, search));
}
