import { get_player_full_name, type Player } from "$lib/core/entities/Player";
import type {
  CreatePlayerTeamMembershipInput,
  PlayerTeamMembership,
} from "$lib/core/entities/PlayerTeamMembership";
import type { Team } from "$lib/core/entities/Team";

export interface PlayerAssignment {
  player: Player;
  selected: boolean;
  jersey_number: number;
  start_date: string;
  current_team_name: string | null;
  current_team_id: string | null;
}

export function build_player_assignments(
  players: Player[],
  memberships: PlayerTeamMembership[],
  all_teams: Team[],
  today_date: string,
): PlayerAssignment[] {
  const team_name_by_id = new Map<string, string>(
    all_teams.map((current_team: Team) => [current_team.id, current_team.name]),
  );
  const active_membership_by_player = new Map<string, PlayerTeamMembership>();

  for (const current_membership of memberships) {
    if (current_membership.status !== "active") continue;
    active_membership_by_player.set(
      current_membership.player_id,
      current_membership,
    );
  }

  return players.map(
    (current_player: Player, current_index: number): PlayerAssignment => {
      const active_membership = active_membership_by_player.get(
        current_player.id,
      );

      return {
        player: current_player,
        selected: false,
        jersey_number: current_index + 1,
        start_date: today_date,
        current_team_name: active_membership
          ? (team_name_by_id.get(active_membership.team_id) ?? "Unknown Team")
          : null,
        current_team_id: active_membership?.team_id ?? null,
      };
    },
  );
}

export function filter_player_assignments_by_team_gender(
  assignments: PlayerAssignment[],
  selected_team: Team | null,
): PlayerAssignment[] {
  if (!selected_team?.gender_id) return assignments;
  return assignments.filter(
    (current_assignment: PlayerAssignment) =>
      !current_assignment.player.gender_id ||
      current_assignment.player.gender_id === selected_team.gender_id,
  );
}

export function filter_player_assignments_by_name(
  assignments: PlayerAssignment[],
  query: string,
): PlayerAssignment[] {
  const normalized_query = query.trim().toLowerCase();
  if (!normalized_query) return assignments;
  return assignments.filter((current_assignment: PlayerAssignment) =>
    get_player_full_name(current_assignment.player)
      .toLowerCase()
      .includes(normalized_query),
  );
}

export function count_selected_players(
  unassigned_players: PlayerAssignment[],
  assigned_players: PlayerAssignment[],
): number {
  const selected_unassigned_players = unassigned_players.filter(
    (current_assignment: PlayerAssignment) => current_assignment.selected,
  );
  const selected_assigned_players = assigned_players.filter(
    (current_assignment: PlayerAssignment) => current_assignment.selected,
  );
  return selected_unassigned_players.length + selected_assigned_players.length;
}

export function get_today_date(): string {
  return new Date().toISOString().split("T")[0];
}

export function get_target_gender_label(
  selected_team: Team | null,
  gender_name_map: Map<string, string>,
): string {
  if (!selected_team?.gender_id) return "";
  const gender_name = gender_name_map.get(selected_team.gender_id) ?? "Unknown";
  return `${gender_name} only`;
}

export function get_selected_player_assignments(
  unassigned_players: PlayerAssignment[],
  assigned_players: PlayerAssignment[],
): PlayerAssignment[] {
  const selected_unassigned_players = unassigned_players.filter(
    (current_assignment: PlayerAssignment) => current_assignment.selected,
  );
  const selected_assigned_players = assigned_players.filter(
    (current_assignment: PlayerAssignment) => current_assignment.selected,
  );
  return [...selected_unassigned_players, ...selected_assigned_players];
}

export function create_membership_input(
  assignment: PlayerAssignment,
  selected_team: Team | null,
  selected_team_id: string,
): CreatePlayerTeamMembershipInput {
  return {
    organization_id: selected_team?.organization_id ?? "",
    player_id: assignment.player.id,
    team_id: selected_team_id,
    start_date: assignment.start_date,
    jersey_number: assignment.jersey_number,
    status: "active",
  };
}
