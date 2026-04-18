import type { Competition } from "$lib/core/entities/Competition";
import {
  type CompetitionStage,
  get_stage_type_label,
} from "$lib/core/entities/CompetitionStage";
import { get_team_logo, type Team } from "$lib/core/entities/Team";

const COMPETITION_RESULTS_DISPLAY_TEXT = {
  date_locale: "en-US",
  unassigned_stage: "Unassigned Stage",
  unknown_stage: "Unknown Stage",
  unknown_team: "Unknown Team",
  unknown_competition: "Unknown Competition",
} as const;

export const competition_results_page_size_options: number[] = [10, 20, 50];

export function format_competition_results_date(date_string: string): string {
  return new Date(date_string).toLocaleDateString(
    COMPETITION_RESULTS_DISPLAY_TEXT.date_locale,
    {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}

export function get_competition_results_stage_name(
  stage_id: string,
  competition_stages: CompetitionStage[],
  competition_stage_map: Map<string, CompetitionStage>,
): string {
  if (!stage_id) {
    return competition_stages.length > 0
      ? COMPETITION_RESULTS_DISPLAY_TEXT.unassigned_stage
      : "";
  }
  return (
    competition_stage_map.get(stage_id)?.name ||
    COMPETITION_RESULTS_DISPLAY_TEXT.unknown_stage
  );
}

export function get_competition_results_stage_type(
  stage_id: string,
  competition_stage_map: Map<string, CompetitionStage>,
): string {
  if (!stage_id) return "";
  const stage = competition_stage_map.get(stage_id);
  return stage ? get_stage_type_label(stage.stage_type) : "";
}

export function get_competition_results_team_name(
  team_id: string,
  team_map: Map<string, Team>,
): string {
  return (
    team_map.get(team_id)?.name || COMPETITION_RESULTS_DISPLAY_TEXT.unknown_team
  );
}

export function get_competition_results_extended_team_name(
  team_id: string,
  extended_team_map: Map<string, Team>,
  team_map: Map<string, Team>,
): string {
  return (
    extended_team_map.get(team_id)?.name ||
    team_map.get(team_id)?.name ||
    COMPETITION_RESULTS_DISPLAY_TEXT.unknown_team
  );
}

export function get_competition_results_extended_competition_name(
  competition_id: string,
  extended_competition_map: Map<string, Competition>,
): string {
  return (
    extended_competition_map.get(competition_id)?.name ||
    COMPETITION_RESULTS_DISPLAY_TEXT.unknown_competition
  );
}

export function get_competition_results_team_logo_url(
  team_id: string,
  team_map: Map<string, Team>,
  extended_team_map: Map<string, Team>,
): string {
  const team = team_map.get(team_id) || extended_team_map.get(team_id);
  return team ? get_team_logo(team) : "";
}
