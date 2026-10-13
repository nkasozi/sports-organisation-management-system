import type { CompetitionStage } from "$lib/core/entities/CompetitionStage";
import type { Fixture } from "$lib/core/entities/Fixture";
import type { Team } from "$lib/core/entities/Team";
import type {
  CompetitionResultsCompetitionFormatState,
  CompetitionResultsSelectedCompetitionState,
} from "$lib/presentation/logic/competitionResultsPageContracts";
import type {
  derive_effective_points_config,
  derive_effective_tie_breakers,
} from "$lib/presentation/logic/competitionResultsPageData";
import type {
  CardSortMode,
  filter_and_sort_card_players,
  filter_and_sort_scorers,
} from "$lib/presentation/logic/competitionResultsStats";
import type {
  build_competition_stage_results_sections,
  calculate_team_standings,
} from "$lib/presentation/logic/competitionStageResults";

export interface CompetitionResultsWorkspaceStateCommand {
  competition_format_state: CompetitionResultsCompetitionFormatState;
  selected_competition_state: CompetitionResultsSelectedCompetitionState;
  competition_stages: CompetitionStage[];
  fixtures: Fixture[];
  teams: Team[];
  team_map: Map<string, Team>;
  upcoming_page: number;
  upcoming_per_page: number;
  results_page: number;
  results_per_page: number;
  stats_team_filter: string;
  stats_card_sort: CardSortMode;
  team_fixtures_in_competition: Fixture[];
  team_fixtures_all_competitions: Fixture[];
  show_all_competitions_fixtures: boolean;
  team_fixtures_page: number;
  team_fixtures_per_page: number;
}

export interface CompetitionResultsWorkspaceStateResult {
  effective_points_config: ReturnType<typeof derive_effective_points_config>;
  effective_tie_breakers: ReturnType<typeof derive_effective_tie_breakers>;
  standings: ReturnType<typeof calculate_team_standings>;
  stage_results_sections: ReturnType<
    typeof build_competition_stage_results_sections
  >;
  competition_stage_map: Map<string, CompetitionStage>;
  completed_fixtures: Fixture[];
  upcoming_fixtures: Fixture[];
  live_team_ids: Set<string>;
  upcoming_total_pages: number;
  paginated_upcoming: Fixture[];
  results_total_pages: number;
  paginated_completed: Fixture[];
  stats_available_teams: string[];
  stats_filtered_scorers: ReturnType<typeof filter_and_sort_scorers>;
  stats_filtered_card_players: ReturnType<typeof filter_and_sort_card_players>;
  displayed_team_fixtures: Fixture[];
  sorted_team_fixtures: Fixture[];
  team_fixtures_total_pages: number;
  paginated_team_fixtures: Fixture[];
}

export type StandingsSection = Pick<
  CompetitionResultsWorkspaceStateResult,
  | "effective_points_config"
  | "effective_tie_breakers"
  | "standings"
  | "stage_results_sections"
  | "competition_stage_map"
>;

export type FixturesSection = Pick<
  CompetitionResultsWorkspaceStateResult,
  | "completed_fixtures"
  | "upcoming_fixtures"
  | "live_team_ids"
  | "upcoming_total_pages"
  | "paginated_upcoming"
  | "results_total_pages"
  | "paginated_completed"
>;

export type StatsSection = Pick<
  CompetitionResultsWorkspaceStateResult,
  | "stats_available_teams"
  | "stats_filtered_scorers"
  | "stats_filtered_card_players"
>;

export type TeamFixturesSection = Pick<
  CompetitionResultsWorkspaceStateResult,
  | "displayed_team_fixtures"
  | "sorted_team_fixtures"
  | "team_fixtures_total_pages"
  | "paginated_team_fixtures"
>;
