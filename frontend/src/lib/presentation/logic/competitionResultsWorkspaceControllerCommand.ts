import type { Competition } from "$lib/core/entities/Competition";
import type { Fixture } from "$lib/core/entities/Fixture";
import type { Team } from "$lib/core/entities/Team";
import type { CompetitionResultsSelectedCompetitionState } from "$lib/presentation/logic/competitionResultsPageContracts";
import type { MatchReportSportRules } from "$lib/presentation/logic/matchReportSportRules";

export interface CompetitionResultsWorkspaceControllerCommand {
  competitions: Competition[];
  fixtures: Fixture[];
  get_branding_logo_url: () => string;
  get_completed_fixtures: () => Fixture[];
  get_selected_competition_state: () => CompetitionResultsSelectedCompetitionState;
  get_sport_rules: () => MatchReportSportRules;
  get_selected_team_id: () => string;
  selected_competition_id: string;
  selected_organization_id: string;
  set_downloading_all_reports: (value: boolean) => void;
  set_downloading_fixture_id: (value: string) => void;
  set_extended_competition_map: (value: Map<string, Competition>) => void;
  set_extended_team_map: (value: Map<string, Team>) => void;
  set_selected_team_id: (value: string) => void;
  set_selected_team_name: (value: string) => void;
  set_share_link_copied: (value: boolean) => void;
  set_show_all_competitions_fixtures: (value: boolean) => void;
  set_team_fixtures_all_competitions: (value: Fixture[]) => void;
  set_team_fixtures_in_competition: (value: Fixture[]) => void;
  set_team_fixtures_loading: (value: boolean) => void;
  team_map: Map<string, Team>;
}

export interface CompetitionResultsWorkspaceControllerRuntime {
  close_team_fixtures_panel: () => void;
  handle_copy_share_link: () => boolean;
  handle_download_all_reports: () => Promise<boolean>;
  handle_download_match_report: (
    fixture: Fixture,
    event: MouseEvent,
  ) => Promise<boolean>;
  handle_team_click: (
    event: CustomEvent<{ team_id: string; team_name: string }>,
  ) => Promise<void>;
}
