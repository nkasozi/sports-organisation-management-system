import type { Competition } from "$lib/core/entities/Competition";
import type { CompetitionTeam } from "$lib/core/entities/CompetitionTeam";
import type { Fixture } from "$lib/core/entities/Fixture";
import { parse_local_calendar_date } from "$lib/core/entities/LocalCalendarDate";
import type { Team } from "$lib/core/entities/Team";
import {
  matches_team_player_search,
  type TeamPlayer,
} from "$lib/core/services/teamPlayers";
import { OptionStatus } from "$lib/core/types/Option";

export type FixtureLineupCreateWizardStep = {
  step_key: "organization" | "fixture" | "team" | "players" | "confirm";
  step_title: string;
  step_description?: string;
  is_completed: boolean;
  is_optional?: boolean;
};

function create_wizard_step(
  step_key: FixtureLineupCreateWizardStep["step_key"],
  step_title: string,
  step_description: string,
  is_completed: boolean,
): FixtureLineupCreateWizardStep {
  return { step_key, step_title, step_description, is_completed };
}

function build_selection_wizard_steps(
  has_selected_organization: boolean,
  has_selected_fixture: boolean,
  has_selected_team: boolean,
): FixtureLineupCreateWizardStep[] {
  return [
    create_wizard_step(
      "organization",
      "Organization",
      "Choose the organization",
      has_selected_organization,
    ),
    create_wizard_step(
      "fixture",
      "Fixture",
      "Choose the fixture",
      has_selected_fixture,
    ),
    create_wizard_step(
      "team",
      "Team",
      "Choose home/away competition team",
      has_selected_team,
    ),
  ];
}

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
    ...build_selection_wizard_steps(
      has_selected_organization,
      has_selected_fixture,
      has_selected_team,
    ),
    create_wizard_step(
      "players",
      "Players",
      `Select ${minimum_players}-${maximum_players}`,
      players_completed,
    ),
    create_wizard_step(
      "confirm",
      "Confirm",
      "Review + lock",
      players_completed && confirm_lock,
    ),
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
  const parsed_date = parse_local_calendar_date(scheduled_date);
  if (parsed_date.status === OptionStatus.NONE) return "";
  const date = parsed_date.value;
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
